---
read_when:
    - Chcesz używać modeli Anthropic w OpenClaw
summary: Używaj Anthropic Claude w OpenClaw za pomocą kluczy API lub Claude CLI
title: Anthropic
x-i18n:
    generated_at: "2026-04-30T10:11:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfaba2eea6a2d263d76036d1e6859fc3b487e886ec460ef2ced83e5e8e834327
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic tworzy rodzinę modeli **Claude**. OpenClaw obsługuje dwie ścieżki uwierzytelniania:

- **Klucz API** — bezpośredni dostęp do API Anthropic z rozliczaniem według użycia (modele `anthropic/*`)
- **Claude CLI** — ponowne użycie istniejącego logowania Claude CLI na tym samym hoście

<Warning>
Pracownicy Anthropic poinformowali nas, że użycie Claude CLI w stylu OpenClaw jest ponownie dozwolone, więc
OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako zatwierdzone, chyba że
Anthropic opublikuje nową politykę.

W przypadku długotrwale działających hostów Gateway klucze API Anthropic nadal są najjaśniejszą i
najbardziej przewidywalną ścieżką produkcyjną.

Aktualna publiczna dokumentacja Anthropic:

- [Dokumentacja referencyjna Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [Omówienie Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Używanie Claude Code z planem Pro lub Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Używanie Claude Code z planem Team lub Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

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
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Najlepsze do:** ponownego użycia istniejącego logowania Claude CLI bez osobnego klucza API.

    <Steps>
      <Step title="Upewnij się, że Claude CLI jest zainstalowany i zalogowany">
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
    Szczegóły konfiguracji i działania backendu Claude CLI znajdują się w [backendach CLI](/pl/gateway/cli-backends).
    </Note>

    ### Przykład konfiguracji

    Preferuj kanoniczną referencję modelu Anthropic oraz nadpisanie środowiska uruchomieniowego CLI:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-7" },
          agentRuntime: { id: "claude-cli" },
        },
      },
    }
    ```

    Starsze referencje modeli `claude-cli/claude-opus-4-7` nadal działają dla
    zgodności, ale nowa konfiguracja powinna zachowywać wybór dostawcy/modelu jako
    `anthropic/*` i umieszczać backend wykonawczy w `agentRuntime.id`.

    <Tip>
    Jeśli chcesz najjaśniejszej ścieżki rozliczeń, użyj zamiast tego klucza API Anthropic. OpenClaw obsługuje też opcje subskrypcyjne od [OpenAI Codex](/pl/providers/openai), [Qwen Cloud](/pl/providers/qwen), [MiniMax](/pl/providers/minimax) i [Z.AI / GLM](/pl/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Domyślne myślenie (Claude 4.6)

Modele Claude 4.6 domyślnie używają w OpenClaw myślenia `adaptive`, gdy nie ustawiono jawnego poziomu myślenia.

Nadpisz dla pojedynczej wiadomości za pomocą `/think:<level>` albo w parametrach modelu:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { thinking: "adaptive" },
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

| Wartość             | Czas trwania cache | Opis                                      |
| ------------------- | ------------------ | ----------------------------------------- |
| `"short"` (domyślne) | 5 minut            | Stosowane automatycznie przy uwierzytelnianiu kluczem API |
| `"long"`            | 1 godzina          | Rozszerzony cache                         |
| `"none"`            | Bez buforowania    | Wyłącza buforowanie promptów              |

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
  <Accordion title="Nadpisania cache dla poszczególnych agentów">
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

    Dzięki temu jeden agent może zachować długotrwały cache, podczas gdy inny agent na tym samym modelu wyłącza buforowanie dla ruchu skokowego lub rzadko ponownie używanego.

  </Accordion>

  <Accordion title="Uwagi o Bedrock Claude">
    - Modele Anthropic Claude w Bedrock (`amazon-bedrock/*anthropic.claude*`) akceptują przekazywanie `cacheRetention`, gdy jest skonfigurowane.
    - Modele Bedrock spoza Anthropic są wymuszane w czasie działania na `cacheRetention: "none"`.
    - Inteligentne wartości domyślne dla klucza API ustawiają też `cacheRetention: "short"` dla referencji Claude-on-Bedrock, gdy nie ustawiono jawnej wartości.

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
    - Jawne parametry `serviceTier` lub `service_tier` nadpisują `/fast`, gdy ustawiono oba.
    - Na kontach bez pojemności Priority Tier `service_tier: "auto"` może zostać rozstrzygnięte jako `standard`.

    </Note>

  </Accordion>

  <Accordion title="Rozumienie mediów (obraz i PDF)">
    Dołączony Plugin Anthropic rejestruje rozumienie obrazów i PDF. OpenClaw
    automatycznie rozpoznaje możliwości medialne na podstawie skonfigurowanego uwierzytelniania Anthropic — nie
    jest potrzebna dodatkowa konfiguracja.

    | Właściwość       | Wartość              |
    | -------------- | -------------------- |
    | Model domyślny | `claude-opus-4-6`    |
    | Obsługiwane wejście | Obrazy, dokumenty PDF |

    Gdy obraz lub PDF jest dołączony do rozmowy, OpenClaw automatycznie
    kieruje go przez dostawcę rozumienia mediów Anthropic.

  </Accordion>

  <Accordion title="Okno kontekstu 1M (beta)">
    Okno kontekstu 1M Anthropic jest objęte dostępem beta. Włącz je dla modelu:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {
              params: { context1m: true },
            },
          },
        },
      },
    }
    ```

    OpenClaw mapuje to w żądaniach na `anthropic-beta: context-1m-2025-08-07`.

    `params.context1m: true` dotyczy także backendu Claude CLI
    (`claude-cli/*`) dla kwalifikujących się modeli Opus i Sonnet, rozszerzając okno kontekstu
    w czasie działania tych sesji CLI tak, aby odpowiadało zachowaniu bezpośredniego API.

    <Warning>
    Wymaga dostępu do długiego kontekstu w poświadczeniu Anthropic. Starsze uwierzytelnianie tokenem (`sk-ant-oat-*`) jest odrzucane dla żądań kontekstu 1M — OpenClaw zapisuje ostrzeżenie i wraca do standardowego okna kontekstu.
    </Warning>

  </Accordion>

  <Accordion title="Kontekst 1M Claude Opus 4.7">
    `anthropic/claude-opus-4.7` i jego wariant `claude-cli` mają domyślnie okno kontekstu 1M — nie jest potrzebne `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Błędy 401 / token nagle nieprawidłowy">
    Uwierzytelnianie tokenem Anthropic wygasa i może zostać odwołane. Dla nowych konfiguracji użyj zamiast tego klucza API Anthropic.
  </Accordion>

  <Accordion title='Nie znaleziono klucza API dla dostawcy "anthropic"'>
    Uwierzytelnianie Anthropic jest **per agent** — nowi agenci nie dziedziczą kluczy głównego agenta. Uruchom ponownie wdrażanie dla tego agenta (albo skonfiguruj klucz API na hoście Gateway), a następnie sprawdź za pomocą `openclaw models status`.
  </Accordion>

  <Accordion title='Nie znaleziono poświadczeń dla profilu "anthropic:default"'>
    Uruchom `openclaw models status`, aby zobaczyć, który profil uwierzytelniania jest aktywny. Uruchom ponownie wdrażanie albo skonfiguruj klucz API dla tej ścieżki profilu.
  </Accordion>

  <Accordion title="Brak dostępnego profilu uwierzytelniania (wszystkie w czasie odnowienia)">
    Sprawdź `auth.unusableProfiles` w `openclaw models status --json`. Czasy odnowienia po limitach szybkości Anthropic mogą być ograniczone do modelu, więc pokrewny model Anthropic może nadal być użyteczny. Dodaj kolejny profil Anthropic albo poczekaj na zakończenie czasu odnowienia.
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
    Konfiguracja backendu Claude CLI i szczegóły działania.
  </Card>
  <Card title="Buforowanie promptów" href="/pl/reference/prompt-caching" icon="database">
    Jak buforowanie promptów działa u różnych dostawców.
  </Card>
  <Card title="OAuth i uwierzytelnianie" href="/pl/gateway/authentication" icon="key">
    Szczegóły uwierzytelniania i reguły ponownego użycia poświadczeń.
  </Card>
</CardGroup>
