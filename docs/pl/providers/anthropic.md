---
read_when:
    - Chcesz używać modeli Anthropic w OpenClaw
summary: Używanie Anthropic Claude przez klucze API lub Claude CLI w OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-06-27T18:09:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 299bb8661bb894c57ca7a60f350494d22f6b726061ffcb70df053c40a3f842b0
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic tworzy rodzinę modeli **Claude**. OpenClaw obsługuje dwie ścieżki uwierzytelniania:

- **Klucz API** — bezpośredni dostęp do API Anthropic z rozliczaniem według użycia (modele `anthropic/*`)
- **Claude CLI** — ponowne użycie istniejącego logowania Claude Code na tym samym hoście

<Warning>
Backend Claude CLI w OpenClaw uruchamia zainstalowane Claude Code CLI w
nieinteraktywnym trybie drukowania. Aktualna dokumentacja Claude Code od Anthropic opisuje
`claude -p` jako użycie Agent SDK/programistyczne. Od 15 czerwca 2026 r. Anthropic
informuje, że użycie `claude -p` w planie subskrypcyjnym nie korzysta już ze zwykłych limitów
planu Claude; najpierw korzysta z osobnego miesięcznego kredytu Agent SDK, a następnie z
kredytów użycia według standardowych stawek API, gdy te kredyty są włączone.

Interaktywne Claude Code nadal korzysta z limitów zalogowanego planu Claude. Uwierzytelnianie
kluczem API pozostaje bezpośrednim rozliczaniem API w modelu płatności za użycie. W przypadku długotrwale działających hostów Gateway,
współdzielonej automatyzacji i przewidywalnych wydatków produkcyjnych użyj klucza API Anthropic.

Aktualna publiczna dokumentacja Anthropic:

- [Dokumentacja Claude Code CLI](https://code.claude.com/docs/en/cli-usage)
- [Używanie Claude Agent SDK z planem Claude](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Używanie Claude Code z planem Pro lub Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Używanie Claude Code z planem Team lub Enterprise](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Zarządzanie kosztami Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## Pierwsze kroki

<Tabs>
  <Tab title="Klucz API">
    **Najlepsze do:** standardowego dostępu do API i rozliczania według użycia.

    <Steps>
      <Step title="Uzyskaj klucz API">
        Utwórz klucz API w [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Uruchom wdrażanie">
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
    **Najlepsze do:** ponownego użycia istniejącego logowania Claude CLI bez osobnego klucza API.

    <Steps>
      <Step title="Upewnij się, że Claude CLI jest zainstalowane i zalogowane">
        Sprawdź za pomocą:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Uruchom wdrażanie">
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
    [Backend Claude CLI w Docker](/pl/install/docker#claude-cli-backend-in-docker).
    Inne instalacje kontenerowe, takie jak [Podman](/pl/install/podman), nie montują hostowego
    `~/.claude` w konfiguracji ani w czasie działania; użyj tam klucza API Anthropic albo wybierz
    dostawcę z OAuth zarządzanym przez OpenClaw, takiego jak
    [OpenAI Codex](/pl/providers/openai).
    </Warning>

    ### Przykład konfiguracji

    Preferuj kanoniczne odwołanie do modelu Anthropic oraz nadpisanie środowiska uruchomieniowego CLI:

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
    `anthropic/*` i umieszczać backend wykonawczy w zasadach środowiska uruchomieniowego dostawcy/modelu.

    ### Rozliczenia i `claude -p`

    OpenClaw używa nieinteraktywnej ścieżki `claude -p` z Claude Code dla uruchomień Claude CLI.
    Anthropic obecnie traktuje tę ścieżkę jako użycie Agent SDK/programistyczne:

    - Do 15 czerwca 2026 r. obsługa planu subskrypcyjnego jest zgodna z aktywnymi
      zasadami Claude Code od Anthropic dla zalogowanego konta.
    - Od 15 czerwca 2026 r. użycie `claude -p` w planie subskrypcyjnym najpierw korzysta z
      miesięcznego kredytu Agent SDK użytkownika, a następnie z kredytów użycia według standardowych
      stawek API, jeśli kredyty użycia są włączone.
    - Logowania przez konsolę/klucz API korzystają z rozliczania API w modelu płatności za użycie i nie otrzymują
      subskrypcyjnego kredytu Agent SDK.

    Anthropic może zmienić rozliczanie Claude Code i zachowanie limitów szybkości bez
    wydania OpenClaw. Sprawdź `claude auth status`, `/status` oraz
    podlinkowaną dokumentację Anthropic, gdy przewidywalność rozliczeń ma znaczenie.

    <Tip>
    Do współdzielonej automatyzacji produkcyjnej użyj klucza API Anthropic zamiast
    Claude CLI. OpenClaw obsługuje też opcje w stylu subskrypcji od
    [OpenAI Codex](/pl/providers/openai), [Qwen Cloud](/pl/providers/qwen),
    [MiniMax](/pl/providers/minimax) i [Z.AI / GLM](/pl/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Domyślne myślenie (Claude Fable 5, 4.8 i 4.6)

`anthropic/claude-fable-5` zawsze używa adaptacyjnego myślenia i domyślnie ustawia wysiłek `high`.
Ponieważ Anthropic nie pozwala wyłączyć myślenia dla tego modelu,
`/think off` i `/think minimal` używają wysiłku `low`. OpenClaw pomija też niestandardowe
wartości temperatury w żądaniach Fable 5.

Claude Opus 4.8 domyślnie pozostawia myślenie wyłączone w OpenClaw. Gdy jawnie włączysz adaptacyjne myślenie za pomocą `/think high|xhigh|max`, OpenClaw wysyła wartości wysiłku Opus 4.8 od Anthropic; modele Claude 4.6 domyślnie używają `adaptive`.

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
- [Adaptacyjne myślenie](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Rozszerzone myślenie](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Buforowanie promptów

OpenClaw obsługuje funkcję buforowania promptów Anthropic dla uwierzytelniania kluczem API.

| Wartość             | Czas trwania pamięci podręcznej | Opis                                      |
| ------------------- | ------------------------------- | ----------------------------------------- |
| `"short"` (domyślne) | 5 minut                         | Stosowane automatycznie dla uwierzytelniania kluczem API |
| `"long"`            | 1 godzina                       | Rozszerzona pamięć podręczna              |
| `"none"`            | Bez buforowania                 | Wyłącz buforowanie promptów               |

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
    Użyj parametrów na poziomie modelu jako punktu odniesienia, a następnie nadpisz konkretne agenty przez `agents.list[].params`:

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
    2. `agents.list[].params` (pasujące `id`, nadpisania według klucza)

    Dzięki temu jeden agent może zachować długotrwałą pamięć podręczną, podczas gdy inny agent na tym samym modelu wyłącza buforowanie dla ruchu impulsowego/o niskim ponownym użyciu.

  </Accordion>

  <Accordion title="Uwagi o Bedrock Claude">
    - Modele Anthropic Claude w Bedrock (`amazon-bedrock/*anthropic.claude*`) akceptują przekazywanie `cacheRetention`, gdy jest skonfigurowane.
    - Modele Bedrock inne niż Anthropic są w czasie działania wymuszane na `cacheRetention: "none"`.
    - Inteligentne wartości domyślne dla klucza API ustawiają też `cacheRetention: "short"` dla odwołań Claude-on-Bedrock, gdy nie ustawiono jawnej wartości.

  </Accordion>
</AccordionGroup>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Tryb szybki">
    Wspólny przełącznik `/fast` w OpenClaw obsługuje bezpośredni ruch Anthropic (klucz API i OAuth do `api.anthropic.com`).

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
    - Jawne parametry `serviceTier` lub `service_tier` nadpisują `/fast`, gdy oba są ustawione.
    - Na kontach bez pojemności Priority Tier `service_tier: "auto"` może zostać rozstrzygnięte jako `standard`.

    </Note>

  </Accordion>

  <Accordion title="Rozumienie multimediów (obrazy i PDF)">
    Dołączony Plugin Anthropic rejestruje rozumienie obrazów i PDF. OpenClaw
    automatycznie rozpoznaje możliwości multimedialne z skonfigurowanego uwierzytelniania Anthropic — nie jest
    potrzebna dodatkowa konfiguracja.

    | Właściwość       | Wartość               |
    | --------------- | --------------------- |
    | Model domyślny  | `claude-opus-4-8`     |
    | Obsługiwane wejście | Obrazy, dokumenty PDF |

    Gdy obraz lub PDF jest dołączony do rozmowy, OpenClaw automatycznie
    kieruje go przez dostawcę rozumienia multimediów Anthropic.

  </Accordion>

  <Accordion title="Okno kontekstu 1M">
    Okno kontekstu 1M Anthropic jest dostępne w modelach Claude 4.x zdolnych do GA,
    takich jak Opus 4.8, Opus 4.7, Opus 4.6 i Sonnet 4.6. OpenClaw automatycznie ustawia dla tych modeli
    rozmiar 1M:

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

    `params.context1m: true` dotyczy też backendu Claude CLI
    (`claude-cli/*`) dla kwalifikujących się modeli Opus i Sonnet zdolnych do GA, zachowując
    okno kontekstu środowiska uruchomieniowego dla tych sesji CLI tak, aby pasowało do zachowania
    bezpośredniego API.

    <Warning>
    Wymaga dostępu do długiego kontekstu na Twoich poświadczeniach Anthropic. Uwierzytelnianie tokenem OAuth/subskrypcji zachowuje wymagane nagłówki beta Anthropic, ale OpenClaw usuwa wycofany nagłówek beta 1M, jeśli pozostaje w starszej konfiguracji.
    </Warning>

  </Accordion>

  <Accordion title="Kontekst 1M Claude Opus 4.8">
    `anthropic/claude-opus-4-8` i jego wariant `claude-cli` mają domyślnie okno kontekstu
    1M — bez potrzeby `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Błędy 401 / token nagle nieprawidłowy">
    Uwierzytelnianie tokenem Anthropic wygasa i może zostać odwołane. W przypadku nowych konfiguracji użyj zamiast tego klucza API Anthropic.
  </Accordion>

  <Accordion title='Nie znaleziono klucza API dla dostawcy "anthropic"'>
    Uwierzytelnianie Anthropic jest **osobne dla każdego agenta** — nowi agenci nie dziedziczą kluczy głównego agenta. Uruchom ponownie onboarding dla tego agenta (lub skonfiguruj klucz API na hoście Gateway), a następnie zweryfikuj za pomocą `openclaw models status`.
  </Accordion>

  <Accordion title='Nie znaleziono poświadczeń dla profilu "anthropic:default"'>
    Uruchom `openclaw models status`, aby sprawdzić, który profil uwierzytelniania jest aktywny. Uruchom ponownie onboarding albo skonfiguruj klucz API dla tej ścieżki profilu.
  </Accordion>

  <Accordion title="Brak dostępnego profilu uwierzytelniania (wszystkie w okresie wyciszenia)">
    Sprawdź `auth.unusableProfiles` w `openclaw models status --json`. Okresy wyciszenia limitów szybkości Anthropic mogą być ograniczone do konkretnego modelu, więc pokrewny model Anthropic może nadal nadawać się do użycia. Dodaj kolejny profil Anthropic albo poczekaj na zakończenie okresu wyciszenia.
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
  <Card title="Backendy CLI" href="/pl/gateway/cli-backends" icon="terminal">
    Konfiguracja backendu Claude CLI i szczegóły działania w czasie wykonywania.
  </Card>
  <Card title="Buforowanie promptów" href="/pl/reference/prompt-caching" icon="database">
    Jak działa buforowanie promptów u różnych dostawców.
  </Card>
  <Card title="OAuth i uwierzytelnianie" href="/pl/gateway/authentication" icon="key">
    Szczegóły uwierzytelniania i reguły ponownego używania poświadczeń.
  </Card>
</CardGroup>
