---
read_when:
    - Chcesz używać modeli Anthropic w OpenClaw
summary: Używaj Anthropic Claude przez klucze API lub Claude CLI w OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-07-04T15:38:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e6fd143b85bb448f65d5d1b35ce465cce7c6f41987b39b9665910cf71761032
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic tworzy rodzinę modeli **Claude**. OpenClaw obsługuje dwie ścieżki uwierzytelniania:

- **Klucz API** — bezpośredni dostęp do API Anthropic z rozliczaniem według użycia (modele `anthropic/*`)
- **Claude CLI** — ponowne użycie istniejącego logowania Claude Code na tym samym hoście

<Warning>
Backend Claude CLI w OpenClaw uruchamia zainstalowane Claude Code CLI w
nieinteraktywnym trybie drukowania. Aktualna dokumentacja Claude Code od Anthropic opisuje
`claude -p` jako użycie Agent SDK/programistyczne. Aktualizacja wsparcia Anthropic z 15 czerwca 2026 r.
wstrzymała zapowiedzianą zmianę rozliczania Agent SDK. Na razie Anthropic twierdzi, że
Claude Agent SDK, `claude -p` oraz użycie w aplikacjach zewnętrznych nadal korzystają z
limitów użycia subskrypcji. Wcześniej zapowiedziany miesięczny kredyt Agent SDK
nie jest dostępny, dopóki Anthropic rewiduje ten plan.

Interaktywny Claude Code nadal korzysta z limitów zalogowanego planu Claude. Uwierzytelnianie
kluczem API pozostaje bezpośrednim rozliczaniem API w modelu pay-as-you-go. Dla długotrwałych hostów Gateway,
współdzielonej automatyzacji i przewidywalnych kosztów produkcyjnych używaj klucza API Anthropic.

Przed poleganiem na zachowaniu rozliczeń subskrypcyjnych sprawdź aktualne artykuły pomocy Anthropic:

- [Dokumentacja Claude Code CLI](https://code.claude.com/docs/en/cli-usage)
- [Używanie Claude Agent SDK z planem Claude](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Używanie Claude Code z planem Pro lub Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Używanie Claude Code z planem Team lub Enterprise](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Zarządzanie kosztami Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## Pierwsze kroki

<Tabs>
  <Tab title="Klucz API">
    **Najlepsze dla:** standardowego dostępu do API i rozliczania według użycia.

    <Steps>
      <Step title="Uzyskaj klucz API">
        Utwórz klucz API w [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Uruchom onboarding">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        Albo przekaż klucz bezpośrednio:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Sprawdź, czy model jest dostępny">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### Przykład konfiguracji

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Najlepsze dla:** ponownego użycia istniejącego logowania Claude CLI bez osobnego klucza API.

    <Steps>
      <Step title="Upewnij się, że Claude CLI jest zainstalowane i zalogowane">
        Sprawdź za pomocą:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Uruchom onboarding">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw wykrywa i ponownie używa istniejących poświadczeń Claude CLI.
      </Step>
      <Step title="Sprawdź, czy model jest dostępny">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Szczegóły konfiguracji i działania backendu Claude CLI znajdują się w [Backendy CLI](/pl/gateway/cli-backends).
    </Note>

    <Warning>
    Ponowne użycie Claude CLI wymaga, aby proces OpenClaw działał na tym samym hoście co
    logowanie Claude CLI. Instalacje Docker mogą utrwalać katalog domowy kontenera i logować się do
    Claude Code w nim; zobacz
    [backend Claude CLI w Docker](/pl/install/docker#claude-cli-backend-in-docker).
    Inne instalacje kontenerowe, takie jak [Podman](/pl/install/podman), nie montują hostowego
    `~/.claude` podczas konfiguracji ani działania; użyj tam klucza API Anthropic albo wybierz
    dostawcę z OAuth zarządzanym przez OpenClaw, takiego jak
    [OpenAI Codex](/pl/providers/openai).
    </Warning>

    ### Przykład konfiguracji

    Preferuj kanoniczne odwołanie do modelu Anthropic oraz nadpisanie środowiska wykonawczego CLI:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-8" },
          models: {
            "anthropic/claude-opus-4-8": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    Starsze odwołania do modeli `claude-cli/claude-opus-4-7` nadal działają dla
    zgodności, ale nowa konfiguracja powinna utrzymywać wybór dostawcy/modelu jako
    `anthropic/*` i umieszczać backend wykonania w zasadach środowiska wykonawczego dostawcy/modelu.

    ### Rozliczenia i `claude -p`

    OpenClaw używa nieinteraktywnej ścieżki `claude -p` z Claude Code dla uruchomień Claude CLI.
    Anthropic obecnie traktuje tę ścieżkę jako użycie Agent SDK/programistyczne:

    - Aktualizacja wsparcia Anthropic z 15 czerwca 2026 r. wstrzymała wcześniej zapowiedziany
      osobny plan kredytu Agent SDK.
    - Na razie użycie Claude Agent SDK w planie subskrypcyjnym, `claude -p` oraz aplikacji
      zewnętrznych nadal korzysta z limitów użycia zalogowanej subskrypcji.
    - Wcześniej zapowiedziany miesięczny kredyt Agent SDK nie jest dostępny, dopóki
      Anthropic rewiduje ten plan.
    - Logowania Console/kluczem API używają rozliczeń API pay-as-you-go i nie otrzymują
      subskrypcyjnego kredytu Agent SDK.

    Zobacz [artykuł o planie Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    Anthropic dotyczący powiadomienia o wstrzymaniu oraz artykuły o planach Claude Code dla
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    i
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)
    dotyczące zachowania subskrypcji.

    Anthropic może zmienić rozliczenia Claude Code i zachowanie limitów szybkości bez
    wydania OpenClaw. Gdy przewidywalność rozliczeń ma znaczenie, sprawdzaj `claude auth status`, `/status` oraz
    powiązaną dokumentację Anthropic.

    <Tip>
    Do współdzielonej automatyzacji produkcyjnej używaj klucza API Anthropic zamiast
    Claude CLI. OpenClaw obsługuje także opcje w stylu subskrypcyjnym od
    [OpenAI Codex](/pl/providers/openai), [Qwen Cloud](/pl/providers/qwen),
    [MiniMax](/pl/providers/minimax) i [Z.AI / GLM](/pl/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Domyślne ustawienia myślenia (Claude Fable 5, 4.8 i 4.6)

`anthropic/claude-fable-5` zawsze używa adaptacyjnego myślenia i domyślnie ma wysiłek `high`.
Ponieważ Anthropic nie pozwala wyłączyć myślenia dla tego modelu,
`/think off` i `/think minimal` używają wysiłku `low`. OpenClaw pomija także niestandardowe
wartości temperatury dla żądań Fable 5.

Claude Opus 4.8 domyślnie utrzymuje myślenie wyłączone w OpenClaw. Gdy jawnie włączysz adaptacyjne myślenie za pomocą `/think high|xhigh|max`, OpenClaw wysyła wartości wysiłku Opus 4.8 od Anthropic; modele Claude 4.6 domyślnie używają `adaptive`.

Nadpisz dla pojedynczej wiadomości za pomocą `/think:<level>` albo w parametrach modelu:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-8": {
          params: { thinking: "high" },
        },
      },
    },
  },
}
```

<Note>
Powiązana dokumentacja Anthropic:
- [Myślenie adaptacyjne](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Myślenie rozszerzone](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Zapasowa obsługa odmowy ze względów bezpieczeństwa (Claude Fable 5)

<Warning>
Używanie Claude Fable 5 oznacza także używanie Claude Opus 4.8. Fable 5 jest dostarczany z
klasyfikatorami bezpieczeństwa, które mogą odrzucić żądanie, a zatwierdzonym przez Anthropic
sposobem odzyskania jest obsłużenie tej tury przez `claude-opus-4-8`. OpenClaw włącza to
automatycznie dla bezpośrednich żądań z kluczem API, więc niektóre tury Fable są odpowiadane
i rozliczane jako Claude Opus 4.8. Jeśli Twoje zasady lub budżet nie mogą zaakceptować
tur obsłużonych przez Opus, nie wybieraj `anthropic/claude-fable-5`.
</Warning>

### Dlaczego to istnieje

Klasyfikatory Fable 5 zwracają `stop_reason: "refusal"` dla żądań w ograniczonych
domenach, a także generują fałszywe alarmy przy pracy bliskiej dopuszczalnej (narzędzia
bezpieczeństwa, nauki przyrodnicze, a nawet prośby do modelu o odtworzenie jego surowego
rozumowania). Bez mechanizmu zapasowego tura kończy się błędem, mimo że
inny model Claude chętnie by ją obsłużył — własny komunikat odmowy Anthropic
instruuje integratorów API, aby skonfigurowali model zapasowy.

### Jak to działa

1. Dla każdego bezpośredniego żądania z kluczem API do `anthropic/claude-fable-5` OpenClaw
   wysyła zgodę na mechanizm zapasowy po stronie serwera Anthropic: nagłówek beta
   `server-side-fallback-2026-06-01` oraz
   `fallbacks: [{"model": "claude-opus-4-8"}]`. Claude Opus 4.8 jest jedynym
   celem zapasowym, na który Anthropic zezwala dla Fable 5.
2. Mechanizm zapasowy uruchamia wyłącznie odmowa klasyfikatora bezpieczeństwa. Limity szybkości,
   przeciążenia i błędy serwera zachowują się dokładnie jak wcześniej i przechodzą przez
   normalne [przełączanie awaryjne modelu](/pl/concepts/model-failover) OpenClaw.
3. Ratowanie odbywa się wewnątrz tego samego wywołania. Odmowa przed jakimkolwiek wyjściem jest
   niewidoczna poza opóźnieniem; cała odpowiedź pochodzi z Opus 4.8. Przy odmowie
   w środku strumienia częściowy tekst jest zachowywany jako prefiks, od którego kontynuuje
   model zapasowy, natomiast rozumowanie i wywołania narzędzi odrzuconego modelu
   są odrzucane zgodnie z regułami odtwarzania Anthropic (nie wolno ich odsyłać ani
   wykonywać).
4. Jeśli Claude Opus 4.8 również odmówi, tura pokazuje odmowę jako
   błąd, dokładnie tak jak przed tą funkcją.

Mechanizm zapasowy działa na poziomie API Anthropic, więc `claude-opus-4-8` nie
musi znajdować się na skonfigurowanej liście modeli ani w łańcuchu zapasowym — klucz API
obsługujący Fable zawsze może obsłużyć Opus.

### Obserwowalność i rozliczenia

- Tura obsłużona przez mechanizm zapasowy zapisuje diagnostykę `provider_fallback` w
  wiadomości asystenta, nazywając `fromModel` i `toModel`, a pole
  `responseModel` wiadomości zgłasza `claude-opus-4-8`.
- Anthropic rozlicza za próbę: odmowa przed wyjściem jest bezpłatna, a ratowanie
  jest rozliczane według stawek Claude Opus 4.8 (obecnie połowa stawek Fable 5). Szacunek
  kosztu na turę w OpenClaw wycenia tury obsłużone mechanizmem zapasowym według stawek Opus, aby to dopasować.
- Odmowa w środku strumienia dodatkowo rozlicza już przesłaną częściową odpowiedź Fable
  po stronie Anthropic; ta część jest raportowana w użyciu na próbę w API,
  ale nie jest wliczana do szacunku kosztu na turę w OpenClaw.

### Zakres

Dotyczy `anthropic/claude-fable-5` z uwierzytelnianiem kluczem API wobec
`api.anthropic.com`. OAuth (ponowne użycie subskrypcji Claude CLI), bazowe adresy URL proxy,
żądania Bedrock, Vertex i Foundry pozostają bez zmian i nadal pokazują
odmowy jako błędy.

Zweryfikowano na żywo: łagodny prompt proszący Fable 5 o odtworzenie surowego łańcucha
myśli jest odrzucany z `category: "reasoning_extraction"`, gdy zostanie wysłany bez
mechanizmów zapasowych, a ten sam prompt przez OpenClaw zwraca normalną odpowiedź obsłużoną przez Opus
z dołączoną diagnostyką `provider_fallback`.

Zobacz [przewodnik po odmowach i mechanizmach zapasowych](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)
Anthropic, aby poznać bazowe zachowanie.

## Buforowanie promptów

OpenClaw obsługuje funkcję buforowania promptów Anthropic dla uwierzytelniania kluczem API.

| Wartość             | Czas trwania pamięci podręcznej | Opis                                      |
| ------------------- | ------------------------------- | ----------------------------------------- |
| `"short"` (domyślne) | 5 minut                         | Stosowane automatycznie dla uwierzytelniania kluczem API |
| `"long"`            | 1 godzina                       | Rozszerzona pamięć podręczna              |
| `"none"`            | Brak buforowania                | Wyłącza buforowanie promptów              |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Nadpisania pamięci podręcznej dla agenta">
    Użyj parametrów na poziomie modelu jako wartości bazowej, a następnie nadpisz konkretnych agentów przez `agents.list[].params`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    Kolejność scalania konfiguracji:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (pasujące `id`, nadpisuje według klucza)

    Dzięki temu jeden agent może utrzymywać długotrwałą pamięć podręczną, podczas gdy inny agent na tym samym modelu wyłącza buforowanie dla ruchu nagłego lub rzadko ponownie używanego.

  </Accordion>

  <Accordion title="Uwagi dotyczące Bedrock Claude">
    - Modele Anthropic Claude w Bedrock (`amazon-bedrock/*anthropic.claude*`) akceptują przekazywanie `cacheRetention`, gdy jest skonfigurowane.
    - Modele Bedrock inne niż Anthropic są wymuszane na `cacheRetention: "none"` w czasie działania.
    - Inteligentne wartości domyślne dla klucza API ustawiają także `cacheRetention: "short"` dla odwołań Claude-on-Bedrock, gdy nie ustawiono jawnej wartości.

  </Accordion>
</AccordionGroup>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Tryb szybki">
    Wspólny przełącznik OpenClaw `/fast` obsługuje bezpośredni ruch Anthropic (klucz API i OAuth do `api.anthropic.com`).

    | Polecenie | Mapuje na |
    |---------|---------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - Wstrzykiwane tylko dla bezpośrednich żądań `api.anthropic.com`. Trasy proxy pozostawiają `service_tier` bez zmian.
    - Jawne parametry `serviceTier` lub `service_tier` nadpisują `/fast`, gdy ustawiono oba.
    - Na kontach bez pojemności Priority Tier `service_tier: "auto"` może zostać rozstrzygnięte jako `standard`.

    </Note>

  </Accordion>

  <Accordion title="Rozumienie multimediów (obraz i PDF)">
    Dołączony Plugin Anthropic rejestruje rozumienie obrazów i plików PDF. OpenClaw
    automatycznie rozpoznaje możliwości multimedialne na podstawie skonfigurowanego uwierzytelniania Anthropic — nie jest
    potrzebna dodatkowa konfiguracja.

    | Właściwość        | Wartość                 |
    | --------------- | --------------------- |
    | Model domyślny   | `claude-opus-4-8`     |
    | Obsługiwane wejście | Obrazy, dokumenty PDF |

    Gdy do rozmowy dołączony jest obraz lub PDF, OpenClaw automatycznie
    kieruje go przez dostawcę rozumienia multimediów Anthropic.

  </Accordion>

  <Accordion title="Okno kontekstu 1M">
    Okno kontekstu 1M Anthropic jest dostępne w modelach Claude 4.x z obsługą GA,
    takich jak Opus 4.8, Opus 4.7, Opus 4.6 i Sonnet 4.6. OpenClaw automatycznie ustawia rozmiar tych modeli na
    1M:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    Starsze konfiguracje mogą zachować `params.context1m: true`, ale OpenClaw nie wysyła już
    wycofanego nagłówka beta `context-1m-2025-08-07`. Starsze wpisy konfiguracji `anthropicBeta`
    z tą wartością są ignorowane podczas rozstrzygania nagłówków żądania, a
    nieobsługiwane starsze modele Claude pozostają przy swoim normalnym oknie kontekstu.

    `params.context1m: true` dotyczy także backendu Claude CLI
    (`claude-cli/*`) dla kwalifikujących się modeli Opus i Sonnet z obsługą GA, zachowując
    okno kontekstu czasu działania dla tych sesji CLI zgodnie z zachowaniem
    bezpośredniego API.

    <Warning>
    Wymaga dostępu do długiego kontekstu na Twoich poświadczeniach Anthropic. Uwierzytelnianie tokenem OAuth/subskrypcji zachowuje wymagane nagłówki beta Anthropic, ale OpenClaw usuwa wycofany nagłówek beta 1M, jeśli pozostaje on w starszej konfiguracji.
    </Warning>

  </Accordion>

  <Accordion title="Kontekst 1M Claude Opus 4.8">
    `anthropic/claude-opus-4-8` i jego wariant `claude-cli` mają domyślnie okno kontekstu 1M — nie potrzeba `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Błędy 401 / token nagle nieprawidłowy">
    Uwierzytelnianie tokenem Anthropic wygasa i może zostać unieważnione. W nowych konfiguracjach użyj zamiast tego klucza API Anthropic.
  </Accordion>

  <Accordion title='Nie znaleziono klucza API dla dostawcy "anthropic"'>
    Uwierzytelnianie Anthropic jest **osobne dla każdego agenta** — nowi agenci nie dziedziczą kluczy głównego agenta. Uruchom ponownie wdrażanie dla tego agenta (lub skonfiguruj klucz API na hoście Gateway), a następnie zweryfikuj za pomocą `openclaw models status`.
  </Accordion>

  <Accordion title='Nie znaleziono poświadczeń dla profilu "anthropic:default"'>
    Uruchom `openclaw models status`, aby sprawdzić, który profil uwierzytelniania jest aktywny. Uruchom ponownie wdrażanie albo skonfiguruj klucz API dla tej ścieżki profilu.
  </Accordion>

  <Accordion title="Brak dostępnego profilu uwierzytelniania (wszystkie w czasie oczekiwania)">
    Sprawdź `auth.unusableProfiles` w `openclaw models status --json`. Czasy oczekiwania limitu szybkości Anthropic mogą być ograniczone do modelu, więc pokrewny model Anthropic może nadal być używalny. Dodaj kolejny profil Anthropic albo poczekaj na zakończenie czasu oczekiwania.
  </Accordion>
</AccordionGroup>

<Note>
Więcej pomocy: [Rozwiązywanie problemów](/pl/help/troubleshooting) i [FAQ](/pl/help/faq).
</Note>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i zachowania awaryjnego przełączania.
  </Card>
  <Card title="Backendy CLI" href="/pl/gateway/cli-backends" icon="terminal">
    Konfiguracja backendu Claude CLI i szczegóły czasu działania.
  </Card>
  <Card title="Buforowanie promptów" href="/pl/reference/prompt-caching" icon="database">
    Jak działa buforowanie promptów u różnych dostawców.
  </Card>
  <Card title="OAuth i uwierzytelnianie" href="/pl/gateway/authentication" icon="key">
    Szczegóły uwierzytelniania i reguły ponownego użycia poświadczeń.
  </Card>
</CardGroup>
