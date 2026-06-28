---
read_when:
    - Chcesz używać modeli Anthropic w OpenClaw
summary: Używaj Anthropic Claude przez klucze API lub Claude CLI w OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-06-28T20:44:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48a2792e464175b3ebe6acd92606c20231fd31940f56e2432bb45657eb0a68d7
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic tworzy rodzinę modeli **Claude**. OpenClaw obsługuje dwie ścieżki uwierzytelniania:

- **Klucz API** — bezpośredni dostęp do API Anthropic z rozliczeniem opartym na użyciu (modele `anthropic/*`)
- **Claude CLI** — ponowne użycie istniejącego logowania Claude Code na tym samym hoście

<Warning>
Backend Claude CLI w OpenClaw uruchamia zainstalowany Claude Code CLI w
nieinteraktywnym trybie drukowania. Obecna dokumentacja Claude Code firmy Anthropic opisuje
`claude -p` jako użycie Agent SDK/programistyczne. Aktualizacja wsparcia Anthropic z 15 czerwca 2026 r.
wstrzymała zapowiedzianą zmianę rozliczeń Agent SDK. Na razie Anthropic informuje, że
Claude Agent SDK, `claude -p` i użycie aplikacji zewnętrznych nadal korzystają z
limitów użycia subskrypcji. Wcześniej zapowiadany miesięczny kredyt Agent SDK
nie jest dostępny, dopóki Anthropic zmienia ten plan.

Interaktywny Claude Code nadal korzysta z limitów zalogowanego planu Claude. Uwierzytelnianie
kluczem API pozostaje bezpośrednim rozliczeniem API pay-as-you-go. W przypadku długotrwałych hostów Gateway,
współdzielonej automatyzacji i przewidywalnych kosztów produkcyjnych użyj klucza API Anthropic.

Sprawdź aktualne artykuły wsparcia Anthropic, zanim oprzesz się na zachowaniu
rozliczeń subskrypcyjnych:

- [Dokumentacja Claude Code CLI](https://code.claude.com/docs/en/cli-usage)
- [Używanie Claude Agent SDK z planem Claude](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Używanie Claude Code z planem Pro lub Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Używanie Claude Code z planem Team lub Enterprise](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Zarządzanie kosztami Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## Pierwsze kroki

<Tabs>
  <Tab title="API key">
    **Najlepsze do:** standardowego dostępu API i rozliczeń opartych na użyciu.

    <Steps>
      <Step title="Get your API key">
        Utwórz klucz API w [konsoli Anthropic](https://console.anthropic.com/).
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        Albo przekaż klucz bezpośrednio:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Verify the model is available">
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
    **Najlepsze do:** ponownego użycia istniejącego logowania Claude CLI bez osobnego klucza API.

    <Steps>
      <Step title="Ensure Claude CLI is installed and logged in">
        Zweryfikuj za pomocą:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw wykrywa i ponownie używa istniejących poświadczeń Claude CLI.
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Szczegóły konfiguracji i działania backendu Claude CLI znajdują się w [Backendach CLI](/pl/gateway/cli-backends).
    </Note>

    <Warning>
    Ponowne użycie Claude CLI zakłada, że proces OpenClaw działa na tym samym hoście co
    logowanie Claude CLI. Instalacje Docker mogą utrwalić katalog domowy kontenera i zalogować się do
    Claude Code w nim; zobacz
    [Backend Claude CLI w Docker](/pl/install/docker#claude-cli-backend-in-docker).
    Inne instalacje kontenerowe, takie jak [Podman](/pl/install/podman), nie montują hostowego
    `~/.claude` do konfiguracji ani działania; użyj tam klucza API Anthropic albo wybierz
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
    `anthropic/*` i umieszczać backend wykonywania w zasadach środowiska wykonawczego dostawcy/modelu.

    ### Rozliczenia i `claude -p`

    OpenClaw używa nieinteraktywnej ścieżki `claude -p` z Claude Code dla uruchomień Claude CLI.
    Anthropic obecnie traktuje tę ścieżkę jako użycie Agent SDK/programistyczne:

    - Aktualizacja wsparcia Anthropic z 15 czerwca 2026 r. wstrzymała wcześniej zapowiedziany
      oddzielny plan kredytu Agent SDK.
    - Na razie Claude Agent SDK w planie subskrypcyjnym, `claude -p` i użycie aplikacji zewnętrznych
      nadal korzystają z limitów użycia zalogowanej subskrypcji.
    - Wcześniej zapowiadany miesięczny kredyt Agent SDK nie jest dostępny, dopóki
      Anthropic zmienia ten plan.
    - Logowania przez konsolę/klucz API używają rozliczeń API pay-as-you-go i nie otrzymują
      subskrypcyjnego kredytu Agent SDK.

    Zobacz [artykuł o planie Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    firmy Anthropic, aby sprawdzić powiadomienie o wstrzymaniu, oraz artykuły o planach Claude Code dotyczące
    zachowania subskrypcji
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    i
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).

    Anthropic może zmienić rozliczenia Claude Code i zachowanie limitów szybkości bez wydania
    OpenClaw. Sprawdź `claude auth status`, `/status` i
    powiązaną dokumentację Anthropic, gdy przewidywalność rozliczeń ma znaczenie.

    <Tip>
    Do współdzielonej automatyzacji produkcyjnej użyj klucza API Anthropic zamiast
    Claude CLI. OpenClaw obsługuje też opcje w stylu subskrypcyjnym od
    [OpenAI Codex](/pl/providers/openai), [Qwen Cloud](/pl/providers/qwen),
    [MiniMax](/pl/providers/minimax) i [Z.AI / GLM](/pl/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Domyślne ustawienia myślenia (Claude Fable 5, 4.8 i 4.6)

`anthropic/claude-fable-5` zawsze używa adaptacyjnego myślenia i domyślnie ustawia `high`
wysiłek. Ponieważ Anthropic nie pozwala wyłączyć myślenia dla tego modelu,
`/think off` i `/think minimal` używają `low` wysiłku. OpenClaw pomija też niestandardowe
wartości temperatury dla żądań Fable 5.

Claude Opus 4.8 domyślnie pozostawia myślenie wyłączone w OpenClaw. Gdy jawnie włączysz myślenie adaptacyjne za pomocą `/think high|xhigh|max`, OpenClaw wysyła wartości poziomu wysiłku Opus 4.8 firmy Anthropic; modele Claude 4.6 domyślnie używają `adaptive`.

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

## Buforowanie promptów

OpenClaw obsługuje funkcję buforowania promptów Anthropic dla uwierzytelniania kluczem API.

| Wartość             | Czas trwania pamięci podręcznej | Opis                                              |
| ------------------- | ------------------------------- | ------------------------------------------------- |
| `"short"` (domyślne) | 5 minut                         | Stosowane automatycznie dla uwierzytelniania kluczem API |
| `"long"`            | 1 godzina                       | Rozszerzona pamięć podręczna                      |
| `"none"`            | Bez buforowania                 | Wyłącza buforowanie promptów                      |

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
  <Accordion title="Per-agent cache overrides">
    Użyj parametrów na poziomie modelu jako wartości bazowych, a następnie nadpisz konkretne agenty przez `agents.list[].params`:

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

    Dzięki temu jeden agent może zachować długotrwałą pamięć podręczną, podczas gdy inny agent na tym samym modelu wyłącza buforowanie dla ruchu skokowego lub rzadko ponownie używanego.

  </Accordion>

  <Accordion title="Bedrock Claude notes">
    - Modele Anthropic Claude w Bedrock (`amazon-bedrock/*anthropic.claude*`) akceptują przekazywanie `cacheRetention`, gdy jest skonfigurowane.
    - Modele Bedrock inne niż Anthropic są w czasie wykonywania wymuszane na `cacheRetention: "none"`.
    - Inteligentne wartości domyślne klucza API ustawiają także `cacheRetention: "short"` dla referencji Claude-on-Bedrock, gdy nie ustawiono jawnej wartości.

  </Accordion>
</AccordionGroup>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Fast mode">
    Wspólny przełącznik `/fast` OpenClaw obsługuje bezpośredni ruch Anthropic (klucz API i OAuth do `api.anthropic.com`).

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

  <Accordion title="Media understanding (image and PDF)">
    Dołączony Plugin Anthropic rejestruje rozumienie obrazów i PDF. OpenClaw
    automatycznie rozpoznaje możliwości multimediów na podstawie skonfigurowanego uwierzytelniania Anthropic — nie
    jest wymagana dodatkowa konfiguracja.

    | Właściwość          | Wartość               |
    | --------------- | --------------------- |
    | Model domyślny      | `claude-opus-4-8`     |
    | Obsługiwane wejście | Obrazy, dokumenty PDF |

    Gdy obraz lub PDF zostanie dołączony do rozmowy, OpenClaw automatycznie
    kieruje go przez dostawcę rozumienia multimediów Anthropic.

  </Accordion>

  <Accordion title="1M context window">
    Okno kontekstu 1M Anthropic jest dostępne w modelach Claude 4.x obsługujących GA,
    takich jak Opus 4.8, Opus 4.7, Opus 4.6 i Sonnet 4.6. OpenClaw automatycznie ustawia te modele na
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

    `params.context1m: true` ma także zastosowanie do backendu Claude CLI
    (`claude-cli/*`) dla kwalifikujących się modeli Opus i Sonnet obsługujących GA, zachowując
    okno kontekstu czasu wykonywania dla tych sesji CLI zgodnie z zachowaniem
    bezpośredniego API.

    <Warning>
    Wymaga dostępu do długiego kontekstu w Twoich poświadczeniach Anthropic. Uwierzytelnianie tokenem OAuth/subskrypcji zachowuje wymagane nagłówki beta Anthropic, ale OpenClaw usuwa wycofany nagłówek beta 1M, jeśli pozostaje on w starszej konfiguracji.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8, kontekst 1M">
    `anthropic/claude-opus-4-8` i jego wariant `claude-cli` mają domyślnie
    okno kontekstu 1M — `params.context1m: true` nie jest potrzebne.
  </Accordion>
</AccordionGroup>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Błędy 401 / token nagle jest nieprawidłowy">
    Uwierzytelnianie tokenem Anthropic wygasa i może zostać unieważnione. W nowych konfiguracjach użyj zamiast tego klucza API Anthropic.
  </Accordion>

  <Accordion title='Nie znaleziono klucza API dla dostawcy "anthropic"'>
    Uwierzytelnianie Anthropic jest **osobne dla każdego agenta** — nowi agenci nie dziedziczą kluczy głównego agenta. Uruchom ponownie onboarding dla tego agenta (albo skonfiguruj klucz API na hoście Gateway), a następnie zweryfikuj za pomocą `openclaw models status`.
  </Accordion>

  <Accordion title='Nie znaleziono poświadczeń dla profilu "anthropic:default"'>
    Uruchom `openclaw models status`, aby zobaczyć, który profil uwierzytelniania jest aktywny. Uruchom ponownie onboarding albo skonfiguruj klucz API dla tej ścieżki profilu.
  </Accordion>

  <Accordion title="Brak dostępnego profilu uwierzytelniania (wszystkie w okresie cooldown)">
    Sprawdź `auth.unusableProfiles` w `openclaw models status --json`. Okresy cooldown po limitach szybkości Anthropic mogą być przypisane do modelu, więc pokrewny model Anthropic może nadal być używalny. Dodaj kolejny profil Anthropic albo poczekaj na zakończenie cooldown.
  </Accordion>
</AccordionGroup>

<Note>
Więcej pomocy: [Rozwiązywanie problemów](/pl/help/troubleshooting) i [FAQ](/pl/help/faq).
</Note>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, referencji modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Backendy CLI" href="/pl/gateway/cli-backends" icon="terminal">
    Konfiguracja backendu Claude CLI i szczegóły działania.
  </Card>
  <Card title="Buforowanie promptów" href="/pl/reference/prompt-caching" icon="database">
    Jak buforowanie promptów działa u różnych dostawców.
  </Card>
  <Card title="OAuth i uwierzytelnianie" href="/pl/gateway/authentication" icon="key">
    Szczegóły uwierzytelniania i zasady ponownego użycia poświadczeń.
  </Card>
</CardGroup>
