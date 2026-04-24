---
read_when:
    - Chcesz używać modeli Anthropic w OpenClaw
summary: Używaj Anthropic Claude przez klucze API lub Claude CLI w OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-24T09:26:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9db63fd33dce27b18f5807c995d9ce71b9d14fde55064f745bace31d7991b985
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic tworzy rodzinę modeli **Claude**. OpenClaw obsługuje dwie ścieżki auth:

- **Klucz API** — bezpośredni dostęp do Anthropic API z rozliczaniem usage-based (`anthropic/*` modeli)
- **Claude CLI** — ponowne użycie istniejącego logowania Claude CLI na tym samym hoście

<Warning>
Pracownicy Anthropic powiedzieli nam, że użycie Claude CLI w stylu OpenClaw jest znów dozwolone, więc
OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako usankcjonowane, dopóki
Anthropic nie opublikuje nowej polityki.

Dla długotrwale działających hostów gateway klucze API Anthropic nadal pozostają najczytelniejszą i
najbardziej przewidywalną ścieżką produkcyjną.

Obecna publiczna dokumentacja Anthropic:

- [Dokumentacja CLI Claude Code](https://code.claude.com/docs/en/cli-reference)
- [Przegląd Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Używanie Claude Code z planem Pro lub Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Używanie Claude Code z planem Team lub Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Pierwsze kroki

<Tabs>
  <Tab title="Klucz API">
    **Najlepsze dla:** standardowego dostępu API i rozliczania usage-based.

    <Steps>
      <Step title="Pobierz klucz API">
        Utwórz klucz API w [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Uruchom onboarding">
        ```bash
        openclaw onboard
        # wybierz: Anthropic API key
        ```

        Albo przekaż klucz bezpośrednio:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Zweryfikuj, że model jest dostępny">
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
    **Najlepsze dla:** ponownego użycia istniejącego logowania Claude CLI bez osobnego klucza API.

    <Steps>
      <Step title="Upewnij się, że Claude CLI jest zainstalowane i zalogowane">
        Zweryfikuj przez:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Uruchom onboarding">
        ```bash
        openclaw onboard
        # wybierz: Claude CLI
        ```

        OpenClaw wykrywa i używa ponownie istniejących poświadczeń Claude CLI.
      </Step>
      <Step title="Zweryfikuj, że model jest dostępny">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Szczegóły konfiguracji i runtime backendu Claude CLI znajdziesz w [Backendy CLI](/pl/gateway/cli-backends).
    </Note>

    <Tip>
    Jeśli chcesz mieć najczytelniejszą ścieżkę rozliczeń, użyj zamiast tego klucza API Anthropic. OpenClaw obsługuje też opcje subskrypcyjne z [OpenAI Codex](/pl/providers/openai), [Qwen Cloud](/pl/providers/qwen), [MiniMax](/pl/providers/minimax) i [Z.AI / GLM](/pl/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Domyślne wartości thinking (Claude 4.6)

Modele Claude 4.6 domyślnie używają thinking `adaptive` w OpenClaw, gdy nie ustawiono jawnego poziomu thinking.

Nadpisz per wiadomość przez `/think:<level>` albo w parametrach modelu:

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
- [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
</Note>

## Prompt caching

OpenClaw obsługuje funkcję prompt caching Anthropic dla auth kluczem API.

| Value               | Cache duration | Description                                 |
| ------------------- | -------------- | ------------------------------------------- |
| `"short"` (domyślnie) | 5 minut        | Stosowane automatycznie dla auth kluczem API |
| `"long"`            | 1 godzina      | Rozszerzony cache                           |
| `"none"`            | Bez cache      | Wyłącz prompt caching                       |

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
  <Accordion title="Nadpisania cache per agent">
    Użyj parametrów na poziomie modelu jako bazy, a następnie nadpisz konkretne agenty przez `agents.list[].params`:

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
    2. `agents.list[].params` (dla pasującego `id`, nadpisuje per klucz)

    Dzięki temu jeden agent może utrzymywać długotrwały cache, podczas gdy inny agent na tym samym modelu wyłącza cache dla ruchu skokowego/o niskim ponownym użyciu.

  </Accordion>

  <Accordion title="Uwagi o Bedrock Claude">
    - Modele Anthropic Claude na Bedrock (`amazon-bedrock/*anthropic.claude*`) akceptują przekazywanie `cacheRetention`, jeśli jest skonfigurowane.
    - Modele Bedrock inne niż Anthropic mają w czasie działania wymuszane `cacheRetention: "none"`.
    - Inteligentne wartości domyślne dla auth kluczem API ustawiają też `cacheRetention: "short"` dla referencji Claude-on-Bedrock, gdy nie ustawiono jawnej wartości.
  </Accordion>
</AccordionGroup>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Fast mode">
    Współdzielony przełącznik `/fast` OpenClaw obsługuje bezpośredni ruch Anthropic (klucz API i OAuth do `api.anthropic.com`).

    | Command | Maps to |
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
    - Jawne parametry `serviceTier` albo `service_tier` mają pierwszeństwo przed `/fast`, gdy ustawiono oba.
    - Na kontach bez pojemności Priority Tier `service_tier: "auto"` może zostać rozwiązane do `standard`.
    </Note>

  </Accordion>

  <Accordion title="Rozumienie multimediów (obraz i PDF)">
    Dołączony Plugin Anthropic rejestruje rozumienie obrazów i PDF. OpenClaw
    automatycznie rozwiązuje możliwości multimediów z skonfigurowanego auth Anthropic — nie
    jest wymagana dodatkowa konfiguracja.

    | Property        | Value                   |
    | --------------- | ----------------------- |
    | Default model   | `claude-opus-4-6`       |
    | Supported input | Obrazy, dokumenty PDF   |

    Gdy do rozmowy zostanie dołączony obraz albo PDF, OpenClaw automatycznie
    kieruje go przez dostawcę rozumienia multimediów Anthropic.

  </Accordion>

  <Accordion title="Okno kontekstu 1M (beta)">
    Okno kontekstu 1M Anthropic jest objęte bramką beta. Włącz je per model:

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

    OpenClaw mapuje to do `anthropic-beta: context-1m-2025-08-07` w żądaniach.

    <Warning>
    Wymaga dostępu long-context na twoich poświadczeniach Anthropic. Starsze auth tokenem (`sk-ant-oat-*`) jest odrzucane dla żądań kontekstu 1M — OpenClaw zapisuje ostrzeżenie w logu i wraca do standardowego okna kontekstu.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.7 1M context">
    `anthropic/claude-opus-4.7` i jego wariant `claude-cli` mają domyślnie okno
    kontekstu 1M — bez potrzeby ustawiania `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Błędy 401 / token nagle stał się nieprawidłowy">
    Auth tokenem Anthropic wygasa i może zostać unieważnione. W nowych konfiguracjach używaj zamiast tego klucza API Anthropic.
  </Accordion>

  <Accordion title='No API key found for provider "anthropic"'>
    Auth Anthropic jest **per agent** — nowi agenci nie dziedziczą kluczy głównego agenta. Uruchom onboarding ponownie dla tego agenta (albo skonfiguruj klucz API na hoście gateway), a następnie zweryfikuj przez `openclaw models status`.
  </Accordion>

  <Accordion title='No credentials found for profile "anthropic:default"'>
    Uruchom `openclaw models status`, aby zobaczyć, który profil uwierzytelniania jest aktywny. Uruchom onboarding ponownie albo skonfiguruj klucz API dla tej ścieżki profilu.
  </Accordion>

  <Accordion title="No available auth profile (all in cooldown)">
    Sprawdź `openclaw models status --json` pod kątem `auth.unusableProfiles`. Cooldowny limitu szybkości Anthropic mogą być ograniczone do modelu, więc model siostrzany Anthropic może nadal nadawać się do użycia. Dodaj kolejny profil Anthropic albo poczekaj na wygaśnięcie cooldownu.
  </Accordion>
</AccordionGroup>

<Note>
Więcej pomocy: [Rozwiązywanie problemów](/pl/help/troubleshooting) i [FAQ](/pl/help/faq).
</Note>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, model ref i zachowanie failoveru.
  </Card>
  <Card title="Backendy CLI" href="/pl/gateway/cli-backends" icon="terminal">
    Konfiguracja backendu Claude CLI i szczegóły runtime.
  </Card>
  <Card title="Prompt caching" href="/pl/reference/prompt-caching" icon="database">
    Jak działa prompt caching między dostawcami.
  </Card>
  <Card title="OAuth and auth" href="/pl/gateway/authentication" icon="key">
    Szczegóły auth i zasady ponownego użycia poświadczeń.
  </Card>
</CardGroup>
