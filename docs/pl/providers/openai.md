---
read_when:
    - Chcesz używać modeli OpenAI w OpenClaw
    - Chcesz uwierzytelniania za pomocą subskrypcji Codex zamiast kluczy API
    - Potrzebujesz bardziej rygorystycznego sposobu wykonywania zadań przez agenta GPT-5
summary: Korzystaj z OpenAI w OpenClaw za pomocą kluczy API lub subskrypcji Codex
title: OpenAI
x-i18n:
    generated_at: "2026-07-16T18:54:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 18efddc44f2b06ae9592cdbc01c0aadc4621ddf99e818793a4d835c741a2464e
    source_path: providers/openai.md
    workflow: 16
---

OpenClaw używa jednego identyfikatora dostawcy, `openai`, zarówno do bezpośredniego uwierzytelniania kluczem API, jak i
uwierzytelniania w ramach subskrypcji ChatGPT/Codex. `openai/*` jest kanoniczną trasą modelu.
W przypadku tur osadzonego agenta, gdy zasady środowiska uruchomieniowego nie są ustawione lub mają wartość `auto`, fakty
dotyczące trasy OpenAI decydują, czy OpenClaw może niejawnie wybrać dołączone środowisko uruchomieniowe serwera aplikacji Codex.
Sam prefiks `openai/*` nie wybiera środowiska uruchomieniowego.

- **Modele agenta** — `openai/*` za pośrednictwem środowiska uruchomieniowego wybranego przez jawną
  konfigurację `agentRuntime` lub niejawne zasady tras OpenAI. Do korzystania z subskrypcji
  ChatGPT/Codex należy zalogować się za pomocą uwierzytelniania Codex albo skonfigurować profil
  uwierzytelniania kluczem API, gdy rozliczenia mają odbywać się na podstawie klucza.
- **Interfejsy API OpenAI niezwiązane z agentem** — bezpośredni dostęp do OpenAI Platform, rozliczany za użycie,
  za pośrednictwem `OPENAI_API_KEY` lub profilu uwierzytelniania kluczem API `openai`.
- **Starsza konfiguracja** — odwołania `codex/*` i `openai-codex/*` są naprawiane do postaci
  `openai/*` oraz `agentRuntime.id: "codex"` o zakresie ograniczonym do modelu przez
  `openclaw doctor --fix`.

OpenAI jawnie obsługuje korzystanie z OAuth w ramach subskrypcji w zewnętrznych narzędziach i
przepływach pracy, takich jak OpenClaw.

## Śledzenie użycia i kosztów

OpenClaw rozdziela limit subskrypcji od rozliczeń interfejsu API Platform:

- OAuth ChatGPT/Codex pokazuje plan subskrypcji, okresy limitów i saldo środków.
- `OPENAI_ADMIN_KEY` pokazuje w sekcji **Użycie** interfejsu Control UI 30 dni zgłoszonych przez dostawcę kosztów organizacji i użycia uzupełnień, w tym dzienne wydatki, łączne liczby żądań/tokenów, najczęściej używane modele i kategorie kosztów.
- `OPENAI_PROJECT_ID` opcjonalnie ogranicza historię interfejsu Admin API do jednego projektu.
- OpenClaw nigdy nie wysyła `OPENAI_API_KEY` ani profilu wnioskowania `openai` do interfejsów API organizacji; te dane uwierzytelniające mogą należeć do niestandardowych punktów końcowych, Azure lub punktów końcowych lokalnych dla agenta.

Jawny klucz administratora ma pierwszeństwo przed OAuth. Historia zgłaszana przez dostawcę nie jest łączona z szacowanym kosztem OpenClaw wyliczanym na podstawie sesji; może obejmować aktywność interfejsu API innych klientów i korekty rozliczeniowe po stronie dostawcy.

Dokumentacja OpenAI dotycząca [panelu użycia interfejsu API](https://help.openai.com/en/articles/10478918) opisuje wymagania dotyczące właściciela organizacji oraz jawnego uprawnienia do panelu użycia w celu uzyskania danych o użyciu.

Dostawca, model, środowisko uruchomieniowe i kanał są oddzielnymi warstwami. Jeśli te etykiety
są ze sobą mylone, przed zmianą konfiguracji należy przeczytać dokument [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes).

## Szybki wybór

| Cel                                               | Użyj                                                               | Uwagi                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Subskrypcja ChatGPT/Codex, natywne środowisko uruchomieniowe Codex | `openai/gpt-5.6-sol`                                               | Nowa konfiguracja subskrypcji; należy zalogować się za pomocą uwierzytelniania Codex. |
| Bezpośrednie rozliczanie kluczem API za tury agenta | `openai/gpt-5.6` oraz uporządkowany profil uwierzytelniania kluczem API | Nowa konfiguracja klucza API; sam identyfikator bezpośredniego API wskazuje Sol. |
| Wybór dokładnej warstwy GPT-5.6                   | `openai/gpt-5.6-sol`, `-terra` lub `-luna`                         | Dostępne dla tego konta warstwy można sprawdzić za pomocą `models list`. |
| Konto bez dostępu do GPT-5.6                      | `openai/gpt-5.5`                                                   | Jawny wybór awaryjny; OpenClaw nie obniża wersji niejawnie.          |
| Bezpośrednie rozliczanie kluczem API, jawne środowisko uruchomieniowe OpenClaw | `openai/gpt-5.6` oraz `agentRuntime.id: "openclaw"` dostawcy/modelu | Należy wybrać zwykły profil klucza API `openai`.           |
| Alias najnowszego modelu ChatGPT Instant          | `openai/chat-latest`                                               | Tylko bezpośredni klucz API; zmienny alias, a nie stabilna wartość domyślna. |
| Generowanie lub edytowanie obrazów                | `openai/gpt-image-2`                                               | Działa z `OPENAI_API_KEY` lub OAuth Codex.                         |
| Obrazy z przezroczystym tłem                      | `openai/gpt-image-1.5`                                             | Należy ustawić `outputFormat` na `png` lub `webp` oraz `background=transparent`. |

## Mapa nazw

| Widoczna nazwa                           | Warstwa           | Znaczenie                                                                                |
| ---------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `openai`                                | Prefiks dostawcy  | Kanoniczna trasa modelu OpenAI; fakty dotyczące trasy określają niejawne środowisko uruchomieniowe. |
| Plugin `codex`                         | Plugin            | Dołączony Plugin zapewniający natywne środowisko uruchomieniowe serwera aplikacji Codex i kontrolki czatu `/codex`. |
| `agentRuntime.id: codex` dostawcy/modelu | Środowisko uruchomieniowe agenta | Wymusza natywny mechanizm serwera aplikacji Codex dla pasujących osadzonych tur. |
| `/codex ...`                            | Zestaw poleceń czatu | Wiąże wątki serwera aplikacji Codex z konwersacją i umożliwia sterowanie nimi. |
| `runtime: "acp", agentId: "codex"`      | Trasa sesji ACP | Jawna ścieżka awaryjna uruchamiająca Codex przez ACP/acpx.                                |

## Niejawne środowisko uruchomieniowe agenta

Gdy zasady `agentRuntime` dostawcy/modelu nie są ustawione lub mają wartość `auto`,
należące do dostawcy OpenAI zasady tras wybierają niejawne środowisko uruchomieniowe na podstawie efektywnego
punktu końcowego i adaptera:

| Fakty dotyczące efektywnej trasy                                                                                                                                       | Niejawne środowisko uruchomieniowe |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Dokładny oficjalny punkt końcowy HTTPS Platform z `openai-responses` lub dokładny oficjalny punkt końcowy HTTPS ChatGPT z `openai-chatgpt-responses`; brak utworzonego ręcznie nadpisania żądania | Można wybrać Codex                  |
| Utworzony ręcznie adapter `openai-completions`                                                                                                                            | OpenClaw                           |
| Niestandardowy punkt końcowy                                                                                                                                           | OpenClaw                           |
| Jawny, dokładny oficjalny punkt końcowy używający HTTP                                                                                                                  | Odrzucono                          |
| Trasa z utworzonym ręcznie nadpisaniem żądania dostawcy/modelu                                                                                                         | OpenClaw                           |

Jawna, niedomyślna wartość `agentRuntime.id` dostawcy/modelu pozostaje rozstrzygająca.
Na przykład `agentRuntime.id: "openclaw"` pozostawia w OpenClaw trasę, która w przeciwnym razie
kwalifikowałaby się do Codex, natomiast `agentRuntime.id: "codex"` wymaga Codex i kończy
działanie błędem, gdy efektywna trasa nie jest zadeklarowana jako zgodna z Codex.
Wybór środowiska uruchomieniowego nie zmienia typu danych uwierzytelniających ani sposobu rozliczania: uwierzytelnianie kluczem API
Platform i uwierzytelnianie w ramach subskrypcji ChatGPT/Codex pozostają odrębne.

`openclaw doctor --fix` migruje starsze odwołania modeli `codex/*` i `openai-codex/*`,
starsze identyfikatory profili uwierzytelniania Codex oraz starsze wpisy kolejności uwierzytelniania Codex do
kanonicznej trasy `openai`. Zmigrowane odwołania modeli otrzymują
`agentRuntime.id: "codex"` o zakresie ograniczonym do modelu; w nowej konfiguracji kolejności uwierzytelniania należy używać `auth.order.openai`.

<Note>
Nowa konfiguracja OpenAI ustawia model główny GPT-5.6 tylko wtedy, gdy nie skonfigurowano
modelu głównego. Dodanie lub odświeżenie uwierzytelniania OpenAI zachowuje istniejący jawny
wybór, w tym `openai/gpt-5.5`, chyba że jawnie użyto
`models auth login --set-default` lub `models set`. Profilu uwierzytelniania kluczem API
należy używać tylko wtedy, gdy model agenta ma korzystać z uwierzytelniania kluczem API.
</Note>

## Ograniczona wersja zapoznawcza GPT-5.6

OpenClaw rozpoznaje dokładne identyfikatory modeli `openai/gpt-5.6-sol`,
`openai/gpt-5.6-terra` i `openai/gpt-5.6-luna`. Wszystkie trzy udostępniają
poziomy rozumowania `xhigh` i `max` w bieżącym katalogu. OpenAI opisuje Sol jako
flagową warstwę, Terra jako warstwę zrównoważoną, a Luna jako warstwę szybką
i tańszą. Zobacz
[ogłoszenie wydania GPT-5.6](https://openai.com/index/previewing-gpt-5-6-sol/)
oraz [przewodnik po dostępie](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna).

Przy bezpośrednim uwierzytelnianiu OpenAI kluczem API sam identyfikator `openai/gpt-5.6` jest aliasem
Sol i domyślnym ustawieniem nowej konfiguracji. Natywny katalog Codex nie stosuje
tego aliasu bezpośredniego API po stronie klienta; zależnie od dostępu obszaru roboczego może pokazywać
dokładne identyfikatory Sol, Terra i Luna. Dlatego nowa konfiguracja OAuth ChatGPT/Codex
używa `openai/gpt-5.6-sol`. Bieżące konto można sprawdzić za pomocą:

```bash
openclaw models list --provider openai
```

Dostęp organizacji API i obszaru roboczego Codex może się różnić. Jeśli GPT-5.6 nie jest
dostępny, należy jawnie wybrać GPT-5.5:

```bash
openclaw models set openai/gpt-5.5
```

OpenClaw wyświetla błąd dostępu ze źródła nadrzędnego i nie zastępuje niejawnie
wyboru GPT-5.6 modelem GPT-5.5.

<Note>
Kwalifikujące się dokładne oficjalne trasy HTTPS mogą wybrać dołączony Plugin serwera aplikacji
Codex, gdy zasady środowiska uruchomieniowego nie są ustawione lub mają wartość `auto`; utworzone ręcznie trasy Completions,
niestandardowe punkty końcowe i nadpisania transportu żądań pozostają w OpenClaw. Oficjalne
punkty końcowe HTTP przesyłające dane zwykłym tekstem są odrzucane. Jawna konfiguracja środowiska uruchomieniowego dostawcy/modelu pozostaje
rozstrzygająca. Należy uruchomić `openclaw doctor --fix`, aby naprawić nieaktualne starsze odwołania modeli Codex,
odwołania `codex-cli/*` lub stare przypięcia sesji środowiska uruchomieniowego, które nie zostały ustawione przez
jawną konfigurację środowiska uruchomieniowego.
</Note>

## Zakres obsługiwanych funkcji OpenClaw

| Funkcja OpenAI             | Powierzchnia OpenClaw                                                                         | Stan                                                            |
| ------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Czat / Responses          | dostawca modelu `openai/<model>`                                                               | Tak                                                             |
| Modele subskrypcji Codex | `openai/<model>` z OAuth OpenAI                                                            | Tak                                                             |
| Starsze odwołania do modeli Codex | stare odwołania do modeli Codex, `codex-cli/<model>`                                                     | Naprawiane przez doctor do `openai/<model>`                          |
| Środowisko uruchomieniowe app-server Codex  | Trasa HTTPS zgodna z Codex z nieustawionym środowiskiem uruchomieniowym/`auto` lub jawnym `agentRuntime.id: codex`  | Tak                                                             |
| Wyszukiwanie w internecie po stronie serwera    | Natywne narzędzie OpenAI Responses                                                                  | Tak, gdy wyszukiwanie w internecie jest włączone i nie przypięto innego dostawcy |
| Obrazy                    | `image_generate`                                                                              | Tak                                                             |
| Filmy                     | `video_generate`                                                                              | Tak                                                             |
| Zamiana tekstu na mowę            | `messages.tts.provider: "openai"` / `tts`                                                     | Tak                                                             |
| Wsadowa zamiana mowy na tekst      | `tools.media.audio` / rozumienie multimediów                                                     | Tak                                                             |
| Strumieniowa zamiana mowy na tekst  | Voice Call `streaming.provider: "openai"`                                                     | Tak                                                             |
| Głos w czasie rzeczywistym            | Voice Call `realtime.provider: "openai"` / rozmowa w interfejsie sterowania `talk.realtime.provider: "openai"` | Tak (klucz API OpenAI Platform)                                   |
| Osadzenia                | dostawca osadzeń pamięci                                                                     | Tak                                                             |

<Note>
Głos OpenAI Realtime korzysta z publicznego interfejsu **OpenAI Platform Realtime
API** i wymaga klucza API Platform. Tokeny OAuth Codex uwierzytelniają
natomiast zaplecze ChatGPT Codex; nie są wymienne z kluczami API Platform
dla publicznych punktów końcowych Realtime.

Jeśli uwierzytelnianie kluczem API zgłasza brak rozliczeń, należy zasilić środki Platform na stronie
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
dla organizacji obsługującej dane uwierzytelniające Realtime podczas korzystania z uwierzytelniania
kluczem API. Głos Realtime akceptuje profil uwierzytelniania kluczem API `openai` utworzony przez
`openclaw onboard --auth-choice openai-api-key`, klucz API Platform ustawiony przez
`talk.realtime.providers.openai.apiKey` dla rozmowy w interfejsie sterowania lub
`plugins.entries.voice-call.config.realtime.providers.openai.apiKey` dla Voice
Call, albo zmienną środowiskową `OPENAI_API_KEY`.
</Note>

## Osadzenia pamięci

OpenClaw może używać OpenAI lub punktu końcowego osadzeń zgodnego z OpenAI do
indeksowania `memory_search` i osadzeń zapytań:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
      },
    },
  },
}
```

W przypadku punktów końcowych zgodnych z OpenAI, które wymagają asymetrycznych etykiet osadzeń, należy ustawić
`queryInputType` i `documentInputType` w `memorySearch`. OpenClaw
przekazuje je jako pola żądań `input_type` specyficzne dla dostawcy: osadzenia
zapytań używają `queryInputType`; indeksowane fragmenty pamięci i indeksowanie wsadowe używają
`documentInputType`. Pełny przykład zawiera
[dokumentacja konfiguracji pamięci](/pl/reference/memory-config#provider-specific-config).

## Pierwsze kroki

<Tabs>
  <Tab title="Klucz API (OpenAI Platform)">
    **Najlepsze zastosowanie:** bezpośredni dostęp do API i rozliczanie według użycia.

    <Steps>
      <Step title="Uzyskanie klucza API">
        Utwórz lub skopiuj klucz API z [panelu OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Uruchomienie konfiguracji początkowej">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Można też przekazać klucz bezpośrednio:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Sprawdzenie dostępności modelu">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Podsumowanie tras

    | Odwołanie do modelu        | Zasady środowiska uruchomieniowego lub właściwości trasy                                 | Trasa                     | Uwierzytelnianie                              |
    | ---------------- | ------------------------------------------------------------- | ------------------------- | --------------------------------- |
    | `openai/gpt-5.6` | nieustawione/`auto`, dokładna oficjalna natywna trasa HTTPS, bez nadpisania żądania | Codex może zostać wybrany     | Uporządkowany profil uwierzytelniania kluczem API      |
    | `openai/gpt-5.6` | dostawca/model `agentRuntime.id: "openclaw"`                  | Wbudowane środowisko uruchomieniowe OpenClaw | Wybrany profil klucza API `openai` |
    | `openai/gpt-5.5` | jawny dostawca/model `agentRuntime.id`                     | Wybrane środowisko uruchomieniowe agenta    | Wybrany profil klucza API OpenAI   |
    | `openai/*`       | utworzone Completions, niestandardowe ustawienie lub nadpisanie żądania | Wbudowane środowisko uruchomieniowe OpenClaw | Typ danych uwierzytelniających pozostaje bez zmian |
    | `openai/*`       | oficjalny punkt końcowy HTTP w postaci zwykłego tekstu                  | Odrzucono                 | Dane uwierzytelniające nie są wysyłane             |

    <Note>
    Gdy środowisko uruchomieniowe nie jest ustawione lub ma wartość `auto`, tylko kwalifikująca się dokładna oficjalna natywna
    trasa HTTPS może niejawnie wybrać środowisko uruchomieniowe app-server Codex. W przypadku uwierzytelniania kluczem API
    dla modelu agenta należy utworzyć profil uwierzytelniania kluczem API `openai` i ustawić jego kolejność za pomocą
    `auth.order.openai`; `OPENAI_API_KEY` pozostaje bezpośrednią opcją awaryjną dla
    powierzchni API OpenAI innych niż agentowe. Uruchom `openclaw doctor --fix`, aby zmigrować starsze
    wpisy kolejności uwierzytelniania starszego Codex.
    </Note>

    ### Przykład konfiguracji

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.6" } } },
    }
    ```

    Podstawowy identyfikator bezpośredniego API `gpt-5.6` wskazuje warstwę Sol. Jeśli ta organizacja
    API nie udostępnia GPT-5.6, należy jawnie ustawić model podstawowy na
    `openai/gpt-5.5`.

    Aby wypróbować bieżący model Instant z ChatGPT za pośrednictwem API OpenAI, należy ustawić model
    na `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` jest zmiennym aliasem. Nowa konfiguracja klucza API OpenAI używa zamiast niego
    `openai/gpt-5.6`, którego podstawowy identyfikator bezpośredniego API wskazuje Sol. Istniejące
    jawne modele podstawowe, w tym `openai/gpt-5.5`, pozostają bez zmian. Alias
    `chat-latest` akceptuje tylko szczegółowość tekstu `medium`; OpenClaw wymusza
    dla tego modelu wartość `medium` przy każdej innej żądanej szczegółowości.

    <Warning>
    OpenClaw **nie** udostępnia `gpt-5.3-codex-spark` w bezpośredniej trasie
    klucza API OpenAI. Jest on dostępny tylko przez wpisy katalogu subskrypcji
    Codex, jeśli udostępnia go zalogowane konto.
    </Warning>

  </Tab>

  <Tab title="Subskrypcja Codex">
    **Najlepsze zastosowanie:** korzystanie z subskrypcji ChatGPT/Codex z natywnym wykonywaniem przez
    app-server Codex zamiast osobnego klucza API. Chmura Codex wymaga
    zalogowania się do ChatGPT.

    <Steps>
      <Step title="Uruchomienie OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        Można też uruchomić OAuth bezpośrednio:

        ```bash
        openclaw models auth login --provider openai
        ```

        W konfiguracjach bez interfejsu graficznego lub utrudniających wywołanie zwrotne należy dodać `--device-code`, aby zalogować się
        przy użyciu przepływu kodu urządzenia ChatGPT zamiast wywołania zwrotnego
        przeglądarki lokalnej:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="Użycie kanonicznej trasy modelu OpenAI">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.6-sol
        ```

        Ta dokładna oficjalna natywna trasa HTTPS nie wymaga konfiguracji środowiska
        uruchomieniowego. Może automatycznie wybrać środowisko uruchomieniowe app-server Codex, a
        OpenClaw instaluje lub naprawia dołączony plugin Codex po wybraniu tego środowiska
        uruchomieniowego.
      </Step>
      <Step title="Sprawdzenie dostępności uwierzytelniania Codex">
        ```bash
        openclaw models list --provider openai
        ```

        Po uruchomieniu Gateway wyślij na czacie `/codex status` lub `/codex models`,
        aby zweryfikować natywne środowisko uruchomieniowe app-server.
      </Step>
    </Steps>

    ### Podsumowanie tras

    | Odwołanie do modelu                | Zasady środowiska uruchomieniowego lub właściwości trasy                                 | Trasa                                                    | Uwierzytelnianie                                               |
    | ------------------------ | ------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------- |
    | `openai/gpt-5.6-sol`     | nieustawione/`auto`, dokładna oficjalna natywna trasa HTTPS, bez nadpisania żądania | Codex może zostać wybrany                                    | Logowanie Codex lub uporządkowany profil uwierzytelniania `openai` |
    | `openai/gpt-5.6-terra`   | nieustawione/`auto`, dokładna oficjalna natywna trasa HTTPS, bez nadpisania żądania | Codex może zostać wybrany                                    | Logowanie Codex, gdy katalog udostępnia Terra       |
    | `openai/gpt-5.6-luna`    | nieustawione/`auto`, dokładna oficjalna natywna trasa HTTPS, bez nadpisania żądania | Codex może zostać wybrany                                    | Logowanie Codex, gdy katalog udostępnia Luna        |
    | `openai/gpt-5.6-sol`     | dostawca/model `agentRuntime.id: "openclaw"`                  | Wbudowane środowisko uruchomieniowe OpenClaw, wewnętrzny transport uwierzytelniania Codex | Wybrany profil OAuth `openai`                    |
    | `openai/gpt-5.5`         | jawny dostawca/model `agentRuntime.id`                     | Wybrane środowisko uruchomieniowe agenta                                   | Wybrany profil uwierzytelniania OpenAI                       |
    | `openai/*`               | utworzone Completions, niestandardowe ustawienie lub nadpisanie żądania | Wbudowane środowisko uruchomieniowe OpenClaw                                | Wymagania dotyczące danych uwierzytelniających pozostają specyficzne dla trasy      |
    | `openai/*`               | oficjalny punkt końcowy HTTP w postaci zwykłego tekstu                  | Odrzucono                                                 | Dane uwierzytelniające nie są wysyłane                              |
    | Starsze odwołanie do Codex GPT-5.5 | naprawiane przez doctor                                            | Przepisywane na `openai/gpt-5.5`                            | Zmigrowany profil OAuth OpenAI                      |
    | `codex-cli/gpt-5.5`      | naprawiane przez doctor                                            | Przepisywane na `openai/gpt-5.5`                            | Uwierzytelnianie app-server Codex                              |

    <Warning>
    Nowa konfiguracja oparta na subskrypcji używa dokładnie `openai/gpt-5.6-sol`;
    natywny katalog Codex może również udostępniać dokładne odwołania Terra lub Luna. Jeśli
    konto nie udostępnia GPT-5.6, należy jawnie wybrać `openai/gpt-5.5`. Starsze
    odwołania Codex GPT są starszymi trasami OpenClaw, a nie natywną ścieżką środowiska
    uruchomieniowego Codex; należy uruchomić `openclaw doctor --fix`, aby je zmigrować bez aktualizowania
    istniejącego jawnego wyboru GPT-5.5. `gpt-5.3-codex-spark` pozostaje ograniczone
    do kont, których katalog subskrypcji Codex je udostępnia; bezpośrednie odwołania
    do klucza API OpenAI i Azure pozostają dla niego ukryte.
    </Warning>

    <Note>
    Nowa konfiguracja powinna umieszczać kolejność uwierzytelniania agenta OpenAI w `auth.order.openai`;
    doctor migruje starsze wpisy kolejności uwierzytelniania starszego typu Codex.
    </Note>

    ### Przykład konfiguracji

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.6-sol" },
        },
      },
    }
    ```

    W przypadku zapasowego klucza API należy zachować wybrany model w `openai/*` i umieścić
    kolejność uwierzytelniania w `openai`. OpenClaw najpierw próbuje użyć subskrypcji, a następnie
    klucza API, pozostając w środowisku Codex:

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.6-sol" },
        },
      },
      auth: {
        order: {
          openai: [
            "openai:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    Wdrażanie nie importuje już danych OAuth z `~/.codex`. Należy zalogować się za pomocą
    OAuth w przeglądarce (domyślnie) lub opisanego wyżej przepływu kodu urządzenia; OpenClaw zarządza
    wynikowymi poświadczeniami we własnym magazynie uwierzytelniania agenta.
    </Note>

    ### Sprawdzanie i odzyskiwanie trasowania OAuth Codex

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    W przypadku konkretnego agenta należy dodać `--agent <id>`:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    Jeśli starsza konfiguracja nadal zawiera starsze odwołania Codex GPT lub nieaktualne przypięcie
    sesji środowiska uruchomieniowego OpenAI bez jawnej konfiguracji środowiska uruchomieniowego, należy je naprawić:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Jeśli `models auth list --provider openai` nie wyświetla żadnego użytecznego profilu, należy zalogować się
    ponownie:

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    Należy użyć `--profile-id` dla wielu logowań OAuth Codex w tym samym agencie, a następnie
    sterować nimi za pomocą kolejności uwierzytelniania lub `/model ...@<profileId>`:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    Należy uruchomić `openclaw doctor --fix`, aby zmigrować starsze identyfikatory profili
    i wpisy kolejności ze starszym prefiksem OpenAI Codex przed poleganiem na kolejności profili.

    ### Wskaźnik stanu

    Polecenie czatu `/status` pokazuje, które środowisko uruchomieniowe modelu jest aktywne dla bieżącej
    sesji. Dołączone środowisko serwera aplikacji Codex jest wyświetlane jako
    `Runtime: OpenAI Codex`, gdy wybiera je kwalifikująca się niejawna trasa lub jawna
    zasada środowiska uruchomieniowego dostawcy/modelu.

    ### Ostrzeżenie doctor

    Jeśli starsze odwołania modeli Codex lub nieaktualne przypięcia środowiska uruchomieniowego OpenAI pozostają w konfiguracji
    albo stanie sesji, `openclaw doctor --fix` przepisuje je na `openai/*` ze
    środowiskiem uruchomieniowym Codex, chyba że OpenClaw skonfigurowano jawnie.

    ### Limit okna kontekstu

    OpenClaw traktuje metadane modelu i limit kontekstu środowiska uruchomieniowego jako oddzielne
    wartości. Dla `openai/gpt-5.5` za pośrednictwem katalogu OAuth Codex:

    - Natywne `contextWindow`: `400000`
    - Domyślny limit `contextTokens` środowiska uruchomieniowego: `272000`

    Mniejszy limit domyślny w praktyce zapewnia lepsze parametry opóźnienia i jakości.
    Można go zastąpić za pomocą `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          openai: {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Należy użyć `contextWindow`, aby zadeklarować natywne metadane modelu. Należy użyć `contextTokens`,
    aby ograniczyć budżet kontekstu środowiska uruchomieniowego. Bezpośrednia trasa klucza API OpenAI
    zgłasza większe natywne `contextWindow` (`1000000`) dla `gpt-5.5`; obie
    trasy są śledzone oddzielnie, ponieważ katalogi nadrzędne się różnią.
    </Note>

    ### Odzyskiwanie katalogu

    OpenClaw używa nadrzędnych metadanych katalogu Codex dla `gpt-5.5`, gdy są
    dostępne. Jeśli aktywne wykrywanie Codex pomija wiersz `gpt-5.5`, mimo że konto
    jest uwierzytelnione, OpenClaw syntetyzuje ten wiersz modelu OAuth, aby zadania Cron,
    podagenty i uruchomienia ze skonfigurowanym modelem domyślnym nie kończyły się błędem
    `Unknown model`.

  </Tab>
</Tabs>

## Uwierzytelnianie natywnego serwera aplikacji Codex

Natywne środowisko serwera aplikacji Codex używa odwołań modeli `openai/*`, gdy kwalifikująca się
dokładna oficjalna trasa HTTPS wybiera je niejawnie lub gdy `agentRuntime.id: "codex"`
dostawcy/modelu wybiera je jawnie. Uwierzytelnianie nadal opiera się
na koncie. OpenClaw wybiera uwierzytelnianie w następującej kolejności:

1. Uporządkowane profile uwierzytelniania OpenAI dla agenta, najlepiej w
   `auth.order.openai`. Należy uruchomić `openclaw doctor --fix`, aby zmigrować starsze identyfikatory
   profili uwierzytelniania Codex i kolejność uwierzytelniania.
2. Istniejące konto serwera aplikacji, takie jak lokalne logowanie ChatGPT
   w CLI Codex. W przypadku domyślnego izolowanego katalogu domowego agenta OpenClaw przekazuje to natywne
   konto CLI do serwera aplikacji za pośrednictwem jego RPC logowania; nie współdzieli
   konfiguracji, pluginów ani magazynu wątków CLI.
3. Tylko dla lokalnych uruchomień serwera aplikacji przez stdio i tylko wtedy, gdy serwer aplikacji
   nie zgłasza konta: `CODEX_API_KEY`, a następnie `OPENAI_API_KEY`.

Lokalne logowanie do subskrypcji ChatGPT/Codex nie jest zastępowane tylko dlatego, że
proces Gateway ma również `OPENAI_API_KEY` dla bezpośrednich modeli OpenAI lub
osadzania. Awaryjne użycie klucza API ze środowiska dotyczy wyłącznie lokalnej ścieżki stdio bez konta;
nigdy nie jest wysyłane przez połączenia WebSocket z serwerem aplikacji. Gdy zostanie
wybrany profil Codex typu subskrypcyjnego, OpenClaw nie przekazuje również
`CODEX_API_KEY` ani `OPENAI_API_KEY` do uruchomionego procesu potomnego serwera aplikacji stdio
i zamiast tego wysyła wybrane poświadczenia za pośrednictwem RPC logowania serwera aplikacji.

Gdy ten profil subskrypcji zostanie zablokowany przez limit użycia Codex, OpenClaw
oznacza profil jako zablokowany do czasu resetowania podanego przez Codex i pozwala, aby kolejność
uwierzytelniania przeszła do następnego profilu `openai:*`, bez zmiany wybranego
modelu ani opuszczania środowiska Codex. Po upływie czasu resetowania
profil subskrypcji ponownie staje się dostępny.

## Generowanie obrazów

Dołączony plugin `openai` rejestruje generowanie obrazów za pośrednictwem
narzędzia `image_generate`. Obsługuje generowanie obrazów zarówno z kluczem API OpenAI, jak i OAuth Codex
za pomocą tego samego odwołania modelu `openai/gpt-image-2`.

| Możliwość                | Klucz API OpenAI                     | OAuth Codex                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Odwołanie modelu                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Uwierzytelnianie                      | `OPENAI_API_KEY`                   | Logowanie OAuth OpenAI Codex           |
| Transport                 | API obrazów OpenAI                  | Zaplecze Codex Responses              |
| Maks. liczba obrazów na żądanie    | 4                                  | 4                                    |
| Tryb edycji                 | Włączony (do 5 obrazów referencyjnych) | Włączony (do 5 obrazów referencyjnych)   |
| Zastępowanie rozmiaru            | Obsługiwane, w tym rozmiary 2K/4K   | Obsługiwane, w tym rozmiary 2K/4K     |
| Proporcje / rozdzielczość | Nieprzekazywane do API obrazów OpenAI | Mapowane na obsługiwany rozmiar, gdy jest to bezpieczne |

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
Więcej informacji o wspólnych parametrach narzędzia, wyborze dostawcy i zachowaniu
awaryjnym zawiera sekcja [Generowanie obrazów](/pl/tools/image-generation).
</Note>

`gpt-image-2` jest wartością domyślną dla generowania obrazów z tekstu i edycji obrazów
w OpenAI. `gpt-image-1.5`, `gpt-image-1` i `gpt-image-1-mini` nadal mogą być używane
jako jawne zastąpienia modelu. Należy użyć `openai/gpt-image-1.5` do uzyskania
wyjścia PNG/WebP z przezroczystym tłem; bieżące API `gpt-image-2` odrzuca
`background: "transparent"`.

W przypadku żądania przezroczystego tła należy wywołać `image_generate` z
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` lub `"webp"` oraz
`background: "transparent"`; starsza opcja dostawcy `openai.background` jest
nadal akceptowana. OpenClaw chroni również publiczne trasy OpenAI i OAuth OpenAI Codex,
przepisując domyślne przezroczyste żądania `openai/gpt-image-2` na
`gpt-image-1.5`; Azure i niestandardowe punkty końcowe zgodne z OpenAI zachowują
skonfigurowane nazwy wdrożeń/modeli.

To samo ustawienie jest dostępne dla bezobsługowych uruchomień CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "Prosta naklejka z czerwonym kołem na przezroczystym tle" \
  --json
```

Tych samych flag `--output-format` i `--background` należy użyć z
`openclaw infer image edit` podczas rozpoczynania od pliku wejściowego.
`--openai-background` pozostaje dostępne jako alias specyficzny dla OpenAI. Należy użyć
`--quality low|medium|high|auto`, aby kontrolować jakość i koszt obrazów OpenAI.
Należy użyć `--openai-moderation low|auto`, aby przekazać wskazówkę moderacji OpenAI z
`image generate` lub `image edit`.

W instalacjach z OAuth ChatGPT/Codex należy zachować to samo odwołanie `openai/gpt-image-2`. Gdy
skonfigurowany jest profil OAuth `openai`, OpenClaw odczytuje zapisany token dostępu OAuth
i wysyła żądania obrazów przez zaplecze Codex Responses; nie próbuje najpierw użyć
`OPENAI_API_KEY` ani po cichu przełączyć się awaryjnie na klucz API.
Należy jawnie skonfigurować `models.providers.openai` z kluczem API, niestandardowym bazowym
adresem URL lub punktem końcowym Azure, jeśli zamiast tego ma być używana bezpośrednia trasa API obrazów OpenAI.
Jeśli ten niestandardowy punkt końcowy obrazów znajduje się pod zaufanym adresem sieci LAN/prywatnym,
należy również ustawić `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw
blokuje prywatne/wewnętrzne punkty końcowe obrazów zgodne z OpenAI, jeśli ta zgoda nie jest obecna.

Generowanie:

```
/tool image_generate model=openai/gpt-image-2 prompt="Dopracowany plakat premierowy OpenClaw na macOS" size=3840x2160 count=1
```

Generowanie przezroczystego pliku PNG:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="Prosta naklejka z czerwonym kołem na przezroczystym tle" outputFormat=png background=transparent
```

Edycja:

```
/tool image_generate model=openai/gpt-image-2 prompt="Zachowaj kształt obiektu, zmień materiał na półprzezroczyste szkło" image=/path/to/reference.png size=1024x1536
```

## Generowanie filmów

Dołączony plugin `openai` rejestruje generowanie filmów za pośrednictwem
narzędzia `video_generate`.

| Możliwość       | Wartość                                                                              |
| ---------------- | ---------------------------------------------------------------------------------- |
| Model domyślny    | `openai/sora-2`                                                                    |
| Tryby            | Tekst na film, obraz na film, edycja pojedynczego filmu                                   |
| Dane referencyjne | 1 obraz lub 1 film                                                                 |
| Zastępowanie rozmiaru   | Obsługiwane dla tekstu na film i obrazu na film                                     |
| Proporcje     | Konwertowane na najbliższy obsługiwany rozmiar, bez przekazywania surowej wartości                         |
| Inne ustawienia zastępcze  | `resolution`, `audio`, `watermark` nie są obsługiwane i są pomijane z ostrzeżeniem narzędzia |

Żądania OpenAI dotyczące konwersji obrazu na wideo używają `POST /v1/videos` z obrazem
`input_reference`. Edycje pojedynczego wideo używają `POST /v1/videos/edits` z
przesłanym wideo w polu `video`.

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
Zobacz [Generowanie wideo](/pl/tools/video-generation), aby uzyskać informacje o wspólnych parametrach narzędzia,
wyborze dostawcy i zachowaniu mechanizmu przełączania awaryjnego.

Dostawca OpenAI deklaruje `supportsSize`, ale nie `supportsAspectRatio` ani
`supportsResolution`. Wspólna warstwa normalizacji OpenClaw konwertuje żądany
`aspectRatio` na najbliższy pasujący `size` OpenAI, zanim
żądanie dotrze do dostawcy, dlatego żądania dotyczące proporcji obrazu zazwyczaj nadal działają.
`resolution` nie ma wartości zastępczej rozmiaru i jest pomijany, co jest zgłaszane wywołującemu jako
`Ignored unsupported overrides for openai/<model>: resolution=<value>`.
</Note>

## Uzupełnienie promptu GPT-5

OpenClaw dodaje wspólne uzupełnienie promptu GPT-5 dla modeli z rodziny GPT-5 u
dostawcy `openai` (w tym starszych, niepoprawionych odwołań Codex, które są normalizowane
do `openai/*`). Inni dostawcy, którzy również udostępniają identyfikatory modeli z rodziny GPT-5, tacy
jak OpenRouter lub trasy opencode, nie otrzymują tej nakładki; jest ona uzależniona od
identyfikatora dostawcy `openai`, a nie wyłącznie od identyfikatora modelu. Starsze modele GPT-4.x nigdy
jej nie otrzymują.

Natywny mechanizm serwera aplikacji Codex nie otrzymuje kontraktu zachowania dotyczącego persony i
dyscypliny korzystania z narzędzi ani przyjaznej nakładki stylu interakcji za pośrednictwem
instrukcji deweloperskich; natywny Codex zachowuje należące do Codex zachowanie bazowe, modelu i
dokumentacji projektu, a OpenClaw wyłącza wbudowaną osobowość Codex dla
natywnych wątków, dzięki czemu pliki osobowości w obszarze roboczym agenta pozostają nadrzędne.
OpenClaw przekazuje natywnym wątkom Codex wyłącznie kontekst środowiska uruchomieniowego: dostarczanie
przez kanał, dynamiczne narzędzia OpenClaw, delegowanie ACP, kontekst obszaru roboczego i
Skills OpenClaw. Tekst wskazówek dotyczących Heartbeat z tego samego uzupełnienia jest
jedynym wyjątkiem: natywne tury Heartbeat Codex go otrzymują, wstrzykniętego jako dedykowane
instrukcje współpracy, a nie za pośrednictwem wspólnego mechanizmu
uzupełniania promptu.

Uzupełnienie GPT-5 dodaje oznaczony kontrakt zachowania dotyczący trwałości
persony, bezpieczeństwa wykonywania, dyscypliny korzystania z narzędzi, formatu wyników, kontroli
ukończenia i weryfikacji w pasujących promptach tworzonych przez OpenClaw. Zachowanie odpowiedzi
specyficzne dla kanału i zachowanie cichych wiadomości pozostają we wspólnym prompcie systemowym OpenClaw
oraz zasadach dostarczania wychodzącego. Warstwa przyjaznego stylu interakcji jest
oddzielna i konfigurowalna.

| Wartość                  | Efekt                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (domyślnie) | Włącza warstwę przyjaznego stylu interakcji |
| `"on"`                 | Alias dla `"friendly"`                      |
| `"off"`                | Wyłącza tylko warstwę przyjaznego stylu       |

<Tabs>
  <Tab title="Konfiguracja">
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
Wartości nie rozróżniają wielkości liter w czasie działania, dlatego zarówno `"Off"`, jak i `"off"` wyłączają
warstwę przyjaznego stylu.
</Tip>

<Note>
Starsze ustawienie `plugins.entries.openai.config.personality` jest nadal odczytywane jako
zapasowe ustawienie zgodności, gdy wspólne ustawienie
`agents.defaults.promptOverlays.gpt5.personality` nie jest określone.
</Note>

## Głos i mowa

<AccordionGroup>
  <Accordion title="Synteza mowy (TTS)">
    Dołączony Plugin `openai` rejestruje syntezę mowy dla
    interfejsu `messages.tts`.

    | Ustawienie      | Ścieżka konfiguracji                                            | Wartość domyślna                          |
    | ------------- | --------------------------------------------------------- | ----------------------------------- |
    | Model        | `messages.tts.providers.openai.model`                  | `gpt-4o-mini-tts`                |
    | Głos        | `messages.tts.providers.openai.speakerVoice`           | `coral`                          |
    | Szybkość        | `messages.tts.providers.openai.speed`                  | (nie ustawiono)                          |
    | Instrukcje | `messages.tts.providers.openai.instructions`           | (nie ustawiono, tylko `gpt-4o-mini-tts`)  |
    | Format       | `messages.tts.providers.openai.responseFormat`         | `opus` dla wiadomości głosowych, `mp3` dla plików |
    | Klucz API      | `messages.tts.providers.openai.apiKey`                 | Używa zastępczo `OPENAI_API_KEY`   |
    | Bazowy adres URL     | `messages.tts.providers.openai.baseUrl`                | `https://api.openai.com/v1`      |
    | Dodatkowa treść żądania   | `messages.tts.providers.openai.extraBody` / `extra_body` | (nie ustawiono)                        |

    Dostępne modele: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Dostępne głosy:
    `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`,
    `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` jest scalane z danymi JSON żądania `/audio/speech` po polach
    wygenerowanych przez OpenClaw, dlatego należy go używać w punktach końcowych zgodnych z OpenAI, które wymagają
    dodatkowych kluczy, takich jak `lang`. Klucze prototypu są ignorowane.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Ustaw `OPENAI_TTS_BASE_URL`, aby zastąpić bazowy adres URL TTS bez wpływu na
    punkt końcowy interfejsu API czatu. Zarówno TTS OpenAI, jak i głos Realtime są konfigurowane
    za pomocą klucza API platformy OpenAI; instalacje korzystające wyłącznie z OAuth mogą nadal używać
    modeli czatu obsługiwanych przez Codex, ale nie funkcji rozmowy głosowej na żywo OpenAI.
    </Note>

  </Accordion>

  <Accordion title="Konwersja mowy na tekst">
    Dołączony Plugin `openai` rejestruje wsadową konwersję mowy na tekst za pośrednictwem
    interfejsu transkrypcji analizy multimediów OpenClaw.

    - Model domyślny: `gpt-4o-transcribe`
    - Punkt końcowy: OpenAI REST `/v1/audio/transcriptions`
    - Ścieżka wejściowa: przesyłanie pliku audio w formacie multipart
    - Używane wszędzie tam, gdzie transkrypcja przychodzącego dźwięku odczytuje `tools.media.audio`,
      w tym dla segmentów kanałów głosowych Discord i załączników audio kanałów

    Aby wymusić użycie OpenAI do transkrypcji przychodzącego dźwięku:

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

    Wskazówki dotyczące języka i promptu są przekazywane do OpenAI, gdy dostarcza je
    wspólna konfiguracja multimediów audio lub żądanie transkrypcji dla danego wywołania.

  </Accordion>

  <Accordion title="Transkrypcja w czasie rzeczywistym">
    Dołączony Plugin `openai` rejestruje transkrypcję w czasie rzeczywistym dla
    Pluginu Voice Call.

    | Ustawienie          | Ścieżka konfiguracji                                                          | Wartość domyślna |
    | ----------------- | ----------------------------------------------------------------------- | --------- |
    | Model            | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Język         | `...openai.language`                                                 | (nie ustawiono) |
    | Prompt           | `...openai.prompt`                                                   | (nie ustawiono) |
    | Czas trwania ciszy | `...openai.silenceDurationMs`                                        | `800`   |
    | Próg VAD    | `...openai.vadThreshold`                                             | `0.5`   |
    | Uwierzytelnianie             | `...openai.apiKey`, `OPENAI_API_KEY` lub profil klucza API `openai`    | Wymagany klucz API platformy |

    <Note>
    Używa połączenia WebSocket z `wss://api.openai.com/v1/realtime` z dźwiękiem
    G.711 u-law (`g711_ulaw` / `audio/pcmu`). W przypadku profilu klucza API
    `openai` Gateway generuje tymczasowy sekret klienta transkrypcji Realtime
    przed otwarciem połączenia WebSocket. Ten dostawca strumieniowy jest przeznaczony dla ścieżki
    transkrypcji w czasie rzeczywistym Pluginu Voice Call; funkcja głosowa Discord obecnie nagrywa krótkie
    segmenty i zamiast tego używa ścieżki transkrypcji wsadowej `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Głos w czasie rzeczywistym">
    Dołączony Plugin `openai` rejestruje głos w czasie rzeczywistym dla Pluginu Voice Call.

    | Ustawienie                               | Ścieżka konfiguracji                                                              | Wartość domyślna             |
    | --------------------------------------- | ---------------------------------------------------------------------------- | ---------------------- |
    | Model                                  | `plugins.entries.voice-call.config.realtime.providers.openai.model`     | `gpt-realtime-2.1`  |
    | Głos                                  | `...openai.voice`                                                       | `alloy`             |
    | Temperatura (most wdrożenia Azure)  | `...openai.temperature`                                                 | `0.8`               |
    | Próg VAD                          | `...openai.vadThreshold`                                                | `0.5`                |
    | Czas trwania ciszy                       | `...openai.silenceDurationMs`                                           | `500`                |
    | Dopełnienie prefiksu                         | `...openai.prefixPaddingMs`                                             | `300`                |
    | Poziom rozumowania                       | `...openai.reasoningEffort`                                             | (nie ustawiono)              |
    | Uwierzytelnianie                                   | profil klucza API `openai`, `...openai.apiKey` lub `OPENAI_API_KEY` | Wymagany klucz API platformy OpenAI |

    Dostępne wbudowane głosy Realtime dla `gpt-realtime-2.1`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI zaleca `marin` i `cedar`, aby uzyskać najlepszą jakość Realtime. Jest to
    oddzielny zestaw od powyższych głosów syntezy mowy; głos przeznaczony wyłącznie do TTS,
    taki jak `fable`, `nova` lub `onyx`, nie jest prawidłowy dla sesji Realtime.
    Ustaw model jawnie na `gpt-realtime-2.1-mini`, jeśli preferowany jest
    mniejszy i tańszy wariant Realtime 2.1.

    <Note>
    **GPT-Live (wkrótce).** Pełnodupleksowe modele OpenAI `gpt-live-1` i
    `gpt-live-1-mini` zastąpiły tryb głosowy ChatGPT w lipcu 2026 r.; interfejs
    API dla deweloperów jest stopniowo udostępniany organizacjom z wczesnym dostępem. OpenClaw
    rozpoznaje rodzinę modeli, ale jeszcze jej nie obsługuje: sesje GPT-Live działają
    wyłącznie przez WebRTC, samodzielnie zarządzają kolejnością wypowiedzi (bez VAD) i delegują pracę agenta
    za pośrednictwem protokołu zdarzeń przekazania, którego transporty Realtime OpenClaw
    jeszcze nie implementują. Skonfigurowanie modelu `gpt-live-*` kończy się bezpiecznym błędem
    ze wskazówkami dotyczącymi zarówno mostu WebSocket, jak i sesji Talk w przeglądarce, zamiast
    po cichu łączyć dźwięk bez dostępu agenta. Dostęp do API jest również ograniczony
    dla poszczególnych organizacji OpenAI podczas wczesnego dostępu. Zachowaj `gpt-realtime-2.1` (
    wartość domyślną) do czasu dodania obsługi GPT-Live.
    </Note>

    <Note>
    Backendowe mosty Realtime OpenAI używają ogólnie dostępnego formatu sesji Realtime
    WebSocket, który nie akceptuje `session.temperature`. Wdrożenia Azure OpenAI
    pozostają dostępne przez `azureEndpoint` i `azureDeployment` oraz
    zachowują format sesji zgodny z wdrożeniem (w tym `temperature`).
    Obsługuje dwukierunkowe wywoływanie narzędzi i dźwięk G.711 u-law.
    </Note>

    <Note>
    Głos czasu rzeczywistego jest wybierany podczas tworzenia sesji. OpenAI pozwala później
    zmienić większość pól sesji, ale głosu nie można zmienić po tym, jak
    model wyemituje dźwięk w tej sesji. OpenClaw obecnie udostępnia
    wbudowane identyfikatory głosów czasu rzeczywistego jako ciągi znaków.
    </Note>

    <Note>
    Funkcja rozmowy w interfejsie sterowania korzysta z sesji czasu rzeczywistego OpenAI w przeglądarce, z
    efemerycznym sekretem klienta wygenerowanym przez Gateway oraz bezpośrednią wymianą SDP WebRTC
    między przeglądarką a interfejsem OpenAI Realtime API. Gateway generuje ten sekret klienta przy użyciu
    wybranego poświadczenia `openai`. Skonfigurowane klucze, profile kluczy API oraz
    `OPENAI_API_KEY` mają pierwszeństwo; profil OAuth `openai` lub zewnętrzne
    logowanie Codex stanowi rozwiązanie rezerwowe. Przekaźnik Gateway i mosty WebSocket czasu rzeczywistego
    zaplecza połączeń głosowych używają tej samej kolejności poświadczeń dla natywnych punktów końcowych OpenAI.
    Weryfikacja na żywo dla opiekunów jest dostępna za pomocą
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    etapy OpenAI weryfikują zarówno most WebSocket zaplecza, jak i wymianę
    SDP WebRTC w przeglądarce bez rejestrowania sekretów.
    Przekaż `--openai-only`, aby uruchomić te dwa etapy bez poświadczeń Google.
    </Note>

  </Accordion>
</AccordionGroup>

## Punkty końcowe Azure OpenAI

Dołączony dostawca `openai` może korzystać z zasobu Azure OpenAI do generowania
obrazów przez zastąpienie bazowego adresu URL. Na ścieżce generowania obrazów OpenClaw
wykrywa nazwy hostów Azure w `models.providers.openai.baseUrl` i automatycznie przełącza się na
format żądań Azure.

<Note>
Głos czasu rzeczywistego korzysta z oddzielnej ścieżki konfiguracji
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
i `models.providers.openai.baseUrl` nie ma na niego wpływu. Ustawienia Azure opisano w panelu **Głos
czasu rzeczywistego** w sekcji [Głos i mowa](#voice-and-speech).
</Note>

Azure OpenAI warto użyć, gdy:

- Istnieje już subskrypcja Azure OpenAI, limit lub umowa
  korporacyjna
- Wymagane są regionalne przechowywanie danych lub mechanizmy zgodności oferowane przez Azure
- Ruch ma pozostać w ramach istniejącej dzierżawy Azure

### Konfiguracja

Aby generować obrazy w Azure za pośrednictwem dołączonego dostawcy `openai`, należy skierować
`models.providers.openai.baseUrl` do zasobu Azure i ustawić `apiKey` na
klucz Azure OpenAI (nie klucz platformy OpenAI):

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

OpenClaw rozpoznaje następujące sufiksy hostów Azure dla trasy generowania
obrazów w Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

W przypadku żądań generowania obrazów kierowanych do rozpoznanego hosta Azure OpenClaw:

- Wysyła nagłówek `api-key` zamiast `Authorization: Bearer`
- Używa ścieżek ograniczonych do wdrożenia (`/openai/deployments/{deployment}/...`)
- Dołącza `?api-version=...` do każdego żądania
- Używa domyślnego limitu czasu żądania wynoszącego 600s dla wywołań generowania obrazów w Azure.
  Wartości `timeoutMs` poszczególnych wywołań nadal zastępują tę wartość domyślną.

Inne bazowe adresy URL (publiczny OpenAI, serwery proxy zgodne z OpenAI) zachowują standardowy
format żądań obrazów OpenAI.

<Note>
Trasowanie Azure dla ścieżki generowania obrazów dostawcy `openai` wymaga
OpenClaw 2026.4.22 lub nowszego. Wcześniejsze wersje traktują każdy niestandardowy
`openai.baseUrl` jak publiczny punkt końcowy OpenAI i nie działają z wdrożeniami obrazów
Azure.
</Note>

### Wersja API

Ustaw `AZURE_OPENAI_API_VERSION`, aby przypiąć określoną wersję zapoznawczą lub GA Azure
dla ścieżki generowania obrazów w Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Gdy zmienna nie jest ustawiona, wartością domyślną jest `2024-12-01-preview`.

### Nazwy modeli są nazwami wdrożeń

Azure OpenAI wiąże modele z wdrożeniami. W przypadku żądań generowania obrazów w Azure
trasowanych przez dołączonego dostawcę `openai` pole `model` w OpenClaw
musi zawierać **nazwę wdrożenia Azure** skonfigurowaną w portalu Azure, a nie
identyfikator publicznego modelu OpenAI.

Jeśli zostanie utworzone wdrożenie o nazwie `gpt-image-2-prod`, które udostępnia `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="Czysty plakat" size=1024x1024 count=1
```

Ta sama zasada dotycząca nazwy wdrożenia ma zastosowanie do każdego wywołania generowania obrazów trasowanego
przez dołączonego dostawcę `openai`.

### Dostępność regionalna

Generowanie obrazów w Azure jest obecnie dostępne tylko w części regionów
(na przykład `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Przed utworzeniem wdrożenia należy sprawdzić aktualną listę regionów Microsoft
i potwierdzić, że dany model jest oferowany w odpowiednim regionie.

### Różnice w parametrach

Azure OpenAI i publiczny OpenAI nie zawsze akceptują te same parametry obrazów.
Azure może odrzucać opcje dozwolone przez publiczny OpenAI (na przykład niektóre
wartości `background` w `gpt-image-2`) lub udostępniać je tylko w określonych wersjach
modelu. Różnice te wynikają z Azure i modelu bazowego, a nie z
OpenClaw. Jeśli żądanie Azure zakończy się błędem walidacji, należy sprawdzić
zestaw parametrów obsługiwany przez dane wdrożenie i wersję API w
portalu Azure.

<Note>
Azure OpenAI używa natywnego transportu i zachowania zgodności, ale nie otrzymuje
ukrytych nagłówków atrybucji OpenClaw — zobacz panel **Trasy natywne a trasy zgodne z OpenAI**
w sekcji [Konfiguracja zaawansowana](#advanced-configuration).

Dla ruchu czatu lub Responses w Azure (poza generowaniem obrazów) należy użyć
procesu wdrażania lub dedykowanej konfiguracji dostawcy Azure; sam `openai.baseUrl`
nie przejmuje formatu API/uwierzytelniania Azure. Istnieje oddzielny
dostawca `azure-openai-responses/*`; zobacz panel Compaction po stronie
serwera poniżej.
</Note>

## Konfiguracja zaawansowana

Poniższe przykłady `params` dla poszczególnych modeli kształtują osadzone żądanie dostawcy
OpenClaw. Ich skonfigurowanie stanowi jawnie określone zachowanie żądania, dlatego kwalifikująca się
trasa `auto` pozostaje w OpenClaw zamiast niejawnie wybierać Codex. Natywny
mechanizm serwera aplikacji Codex zarządza własnym transportem i ustawieniami żądań; jawne
`agentRuntime.id: "codex"` kończy działanie błędem, gdy wynikowa trasa nie jest zadeklarowana jako
zgodna z Codex.

<AccordionGroup>
  <Accordion title="Transport (WebSocket a SSE)">
    OpenClaw używa najpierw WebSocket z awaryjnym przejściem na SSE (`"auto"`) dla `openai/*`.

    W trybie `"auto"` OpenClaw:
    - Ponawia jedną wczesną próbę po awarii WebSocket, zanim przejdzie na SSE
    - Po awarii oznacza WebSocket jako zdegradowany na 60 sekund i używa SSE
      w okresie schładzania
    - Dołącza stabilne nagłówki tożsamości sesji i tury na potrzeby ponownych prób oraz
      ponownych połączeń
    - Normalizuje liczniki użycia (`input_tokens` / `prompt_tokens`) między
      wariantami transportu

    | Wartość                | Zachowanie                          |
    | ---------------------- | ------------------------------------ |
    | `"auto"` (domyślnie)   | Najpierw WebSocket, awaryjnie SSE     |
    | `"sse"`              | Wymusza wyłącznie SSE                    |
    | `"websocket"`        | Wymusza wyłącznie WebSocket              |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Powiązana dokumentacja OpenAI:
    - [Realtime API przez WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Strumieniowe odpowiedzi API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Tryb szybki">
    OpenClaw udostępnia wspólny przełącznik trybu szybkiego dla `openai/*`:

    - **Czat/interfejs:** `/fast status|auto|on|off`
    - **Konfiguracja:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Po włączeniu OpenClaw mapuje tryb szybki na przetwarzanie priorytetowe OpenAI
    (`service_tier = "priority"`). Istniejące wartości `service_tier` są
    zachowywane, a tryb szybki nie zmienia `reasoning` ani
    `text.verbosity`. `fastMode: "auto"` rozpoczyna nowe wywołania modelu w trybie szybkim aż do
    automatycznego progu, a następnie rozpoczyna późniejsze ponowienia, rozwiązania rezerwowe, wyniki narzędzi lub
    wywołania kontynuacji bez trybu szybkiego. Domyślny próg wynosi 60 sekund;
    aby go zmienić, ustaw `params.fastAutoOnSeconds` w aktywnym modelu.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: "auto", fastAutoOnSeconds: 30 } },
          },
        },
      },
    }
    ```

    <Note>
    Zastąpienia sesji mają pierwszeństwo przed konfiguracją. Wyczyszczenie zastąpienia sesji w
    interfejsie Sessions przywraca sesji skonfigurowaną wartość domyślną.
    </Note>

  </Accordion>

  <Accordion title="Przetwarzanie priorytetowe (service_tier)">
    Interfejs API OpenAI udostępnia przetwarzanie priorytetowe przez `service_tier`. Ustawia się je dla każdego
    modelu w OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Obsługiwane wartości: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` jest przekazywane tylko do natywnych punktów końcowych OpenAI
    (`api.openai.com`) i natywnych punktów końcowych Codex (`chatgpt.com/backend-api`).
    Jeśli którykolwiek z tych dostawców jest trasowany przez serwer proxy, OpenClaw pozostawia
    `service_tier` bez zmian.
    </Warning>

  </Accordion>

  <Accordion title="Compaction po stronie serwera (Responses API)">
    W przypadku bezpośrednich modeli OpenAI Responses (`openai/*` w `api.openai.com`)
    opakowanie strumienia OpenClaw we wtyczce OpenAI automatycznie włącza Compaction po stronie
    serwera:

    - Wymusza `store: true` (chyba że zgodność modelu ustawia `supportsStore: false`)
    - Wstrzykuje `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Domyślne `compact_threshold`: 70% z `contextWindow` (lub `80000`, gdy
      jest niedostępne)

    Dotyczy to wbudowanej ścieżki środowiska uruchomieniowego OpenClaw oraz haków dostawcy OpenAI
    używanych przez osadzone uruchomienia. Natywny mechanizm serwera aplikacji Codex zarządza
    własnym kontekstem za pośrednictwem Codex i to ustawienie nie ma na niego wpływu.

    <Tabs>
      <Tab title="Włącz jawnie">
        Przydatne w przypadku zgodnych punktów końcowych, takich jak Azure OpenAI Responses:

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
                "openai/gpt-5.5": {
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
                "openai/gpt-5.5": {
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
    `responsesServerCompaction` steruje wyłącznie wstrzykiwaniem `context_management`.
    Bezpośrednie modele OpenAI Responses nadal wymuszają `store: true`, chyba że zgodność
    ustawia `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Ścisły tryb agentowy GPT">
    W przypadku modeli z rodziny GPT-5 dostawcy `openai`, uruchamianych w osadzonym
    środowisku uruchomieniowym OpenClaw, OpenClaw domyślnie stosuje już bardziej rygorystyczny kontrakt wykonywania o nazwie
    `strict-agentic`. Aktywuje się on automatycznie, gdy rozpoznanym dostawcą jest
    `openai`, a identyfikator modelu pasuje do rodziny GPT-5, chyba że konfiguracja
    jawnie z niego rezygnuje:

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "default" },
        },
      },
    }
    ```

    Jawne ustawienie `"strict-agentic"` nie powoduje żadnych zmian w obsługiwanym wariancie (jest
    już wartością domyślną) i pozostaje nieaktywne dla nieobsługiwanych par dostawca/model.

    Gdy `strict-agentic` jest aktywne, OpenClaw:
    - Automatycznie włącza `update_plan` dla złożonych zadań
    - Ponawia strukturalnie puste tury lub tury zawierające wyłącznie rozumowanie, używając kontynuacji
      z widoczną odpowiedzią
    - Używa jawnych zdarzeń planu mechanizmu wykonawczego, gdy wybrany mechanizm je
      udostępnia

    OpenClaw nie klasyfikuje prozy asystenta, aby rozstrzygnąć, czy tura jest
    planem, aktualizacją postępu czy odpowiedzią końcową.

    <Note>
    Ten kontrakt działa wyłącznie w osadzonym mechanizmie uruchamiania agenta OpenClaw. Nie
    ma zastosowania do natywnego mechanizmu serwera aplikacji Codex, który samodzielnie zarządza
    zachowaniem tur i planów; w przypadku natywnych uruchomień Codex wybór mechanizmu ma większe znaczenie niż
    ustawienie kontraktu wykonania.
    </Note>

  </Accordion>

  <Accordion title="Trasy natywne a zgodne z OpenAI">
    OpenClaw traktuje bezpośrednie punkty końcowe OpenAI, Codex i Azure OpenAI
    inaczej niż ogólne serwery proxy `/v1` zgodne z OpenAI:

    **Trasy natywne** (`openai/*`, Azure OpenAI):
    - Zachowują `reasoning: { effort: "none" }` tylko dla modeli obsługujących poziom
      `none` OpenAI
    - Pomijają wyłączone rozumowanie w przypadku modeli lub serwerów proxy, które odrzucają
      `reasoning.effort: "none"`
    - Domyślnie używają trybu ścisłego dla schematów narzędzi
    - Dołączają ukryte nagłówki atrybucji wyłącznie na zweryfikowanych hostach natywnych (Azure
      OpenAI nie otrzymuje tych nagłówków, mimo że jest trasą natywną)
    - Zachowują kształtowanie żądań przeznaczone wyłącznie dla OpenAI (`service_tier`, `store`,
      zgodność rozumowania, wskazówki dotyczące pamięci podręcznej promptów)

    **Trasy proxy/zgodne:**
    - Używają mniej rygorystycznego zachowania zgodności
    - Usuwają `store` Completions z nienatywnych ładunków `openai-completions`
    - Akceptują zaawansowany przekazywany bez zmian kod JSON `params.extra_body`/`params.extraBody`
      dla serwerów proxy Completions zgodnych z OpenAI
    - Akceptują `params.chat_template_kwargs` dla serwerów proxy Completions zgodnych z OpenAI,
      takich jak vLLM
    - Nie wymuszają ścisłych schematów narzędzi ani nagłówków przeznaczonych wyłącznie dla tras natywnych

  </Accordion>
</AccordionGroup>

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i sposobu działania mechanizmu przełączania awaryjnego.
  </Card>
  <Card title="Generowanie obrazów" href="/pl/tools/image-generation" icon="image">
    Wspólne parametry narzędzia do obrazów i wybór dostawcy.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Wspólne parametry narzędzia do wideo i wybór dostawcy.
  </Card>
  <Card title="OAuth i uwierzytelnianie" href="/pl/gateway/authentication" icon="key">
    Szczegóły uwierzytelniania i reguły ponownego używania danych uwierzytelniających.
  </Card>
</CardGroup>
