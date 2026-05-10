---
read_when:
    - Chcesz korzystać z modeli Anthropic w OpenClaw
summary: Używaj Anthropic Claude w OpenClaw za pomocą kluczy API lub Claude CLI
title: Anthropic
x-i18n:
    generated_at: "2026-05-10T19:50:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: c36764f1adb7585389d241303e9c61c1fe2fa49fefdfb28c314abbafa646b273
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic tworzy rodzinę modeli **Claude**. OpenClaw obsługuje dwie ścieżki uwierzytelniania:

- **klucz API** — bezpośredni dostęp do API Anthropic z rozliczaniem według użycia (modele `anthropic/*`)
- **Claude CLI** — ponowne użycie istniejącego logowania Claude CLI na tym samym hoście

<Warning>
Pracownicy Anthropic poinformowali nas, że użycie Claude CLI w stylu OpenClaw jest ponownie dozwolone, więc
OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako zatwierdzone, chyba że
Anthropic opublikuje nową politykę.

W przypadku długotrwale działających hostów gateway klucze API Anthropic nadal są najjaśniejszą i
najbardziej przewidywalną ścieżką produkcyjną.

Aktualna publiczna dokumentacja Anthropic:

- [Dokumentacja Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [Omówienie Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Używanie Claude Code z planem Pro lub Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Używanie Claude Code z planem Team lub Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Pierwsze kroki

<Tabs>
  <Tab title="API key">
    **Najlepsze do:** standardowego dostępu API i rozliczania według użycia.

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
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
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

    ### Przykład konfiguracji

    Preferuj kanoniczne odwołanie do modelu Anthropic oraz nadpisanie środowiska wykonawczego CLI:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-7" },
          models: {
            "anthropic/claude-opus-4-7": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    Starsze odwołania do modeli `claude-cli/claude-opus-4-7` nadal działają ze względu na
    zgodność, ale nowa konfiguracja powinna zachowywać wybór dostawcy/modelu jako
    `anthropic/*`, a backend wykonawczy umieszczać w polityce środowiska wykonawczego dostawcy/modelu.

    <Tip>
    Jeśli chcesz najjaśniejszej ścieżki rozliczeń, użyj zamiast tego klucza API Anthropic. OpenClaw obsługuje też opcje w stylu subskrypcji od [OpenAI Codex](/pl/providers/openai), [Qwen Cloud](/pl/providers/qwen), [MiniMax](/pl/providers/minimax) i [Z.AI / GLM](/pl/providers/glm).
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

| Wartość             | Czas trwania bufora | Opis                                                   |
| ------------------- | ------------------- | ------------------------------------------------------ |
| `"short"` (domyślnie) | 5 minut             | Stosowane automatycznie dla uwierzytelniania kluczem API |
| `"long"`            | 1 godzina           | Rozszerzony bufor                                      |
| `"none"`            | Bez buforowania     | Wyłącz buforowanie promptów                            |

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
    Użyj parametrów na poziomie modelu jako wartości bazowej, a następnie nadpisz konkretne agenty przez `agents.list[].params`:

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

    Dzięki temu jeden agent może utrzymywać długotrwały bufor, podczas gdy inny agent na tym samym modelu wyłącza buforowanie dla ruchu skokowego lub o niskim ponownym użyciu.

  </Accordion>

  <Accordion title="Bedrock Claude notes">
    - Modele Anthropic Claude w Bedrock (`amazon-bedrock/*anthropic.claude*`) akceptują przekazanie `cacheRetention`, gdy jest skonfigurowane.
    - Modele Bedrock inne niż Anthropic są w czasie działania wymuszane na `cacheRetention: "none"`.
    - Inteligentne wartości domyślne dla klucza API ustawiają też `cacheRetention: "short"` dla odwołań Claude-on-Bedrock, gdy nie ustawiono jawnej wartości.

  </Accordion>
</AccordionGroup>

## Zaawansowana konfiguracja

<AccordionGroup>
  <Accordion title="Fast mode">
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
    - Wstrzykiwane tylko dla bezpośrednich żądań do `api.anthropic.com`. Trasy proxy pozostawiają `service_tier` bez zmian.
    - Jawne parametry `serviceTier` lub `service_tier` nadpisują `/fast`, gdy ustawiono oba.
    - Na kontach bez pojemności Priority Tier `service_tier: "auto"` może zostać rozstrzygnięte jako `standard`.

    </Note>

  </Accordion>

  <Accordion title="Media understanding (image and PDF)">
    Dołączony Plugin Anthropic rejestruje rozumienie obrazów i PDF. OpenClaw
    automatycznie rozstrzyga możliwości multimediów na podstawie skonfigurowanego uwierzytelniania Anthropic — nie
    jest potrzebna żadna dodatkowa konfiguracja.

    | Właściwość        | Wartość               |
    | --------------- | --------------------- |
    | Model domyślny  | `claude-opus-4-7`     |
    | Obsługiwane wejście | Obrazy, dokumenty PDF |

    Gdy obraz lub PDF zostanie dołączony do rozmowy, OpenClaw automatycznie
    kieruje go przez dostawcę rozumienia multimediów Anthropic.

  </Accordion>

  <Accordion title="1M context window (beta)">
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

    `params.context1m: true` ma też zastosowanie do backendu Claude CLI
    (`claude-cli/*`) dla kwalifikujących się modeli Opus i Sonnet, rozszerzając okno
    kontekstu środowiska wykonawczego dla tych sesji CLI tak, aby odpowiadało zachowaniu bezpośredniego API.

    <Warning>
    Wymaga dostępu do długiego kontekstu na Twoim poświadczeniu Anthropic. Starsze uwierzytelnianie tokenem (`sk-ant-oat-*`) jest odrzucane dla żądań kontekstu 1M — OpenClaw zapisuje ostrzeżenie i wraca do standardowego okna kontekstu.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.7 1M context">
    `anthropic/claude-opus-4.7` oraz jego wariant `claude-cli` mają domyślnie okno
    kontekstu 1M — `params.context1m: true` nie jest potrzebne.
  </Accordion>
</AccordionGroup>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="401 errors / token suddenly invalid">
    Uwierzytelnianie tokenem Anthropic wygasa i może zostać unieważnione. W przypadku nowych konfiguracji użyj zamiast tego klucza API Anthropic.
  </Accordion>

  <Accordion title='No API key found for provider "anthropic"'>
    Uwierzytelnianie Anthropic jest **per agent** — nowe agenty nie dziedziczą kluczy głównego agenta. Uruchom ponownie onboarding dla tego agenta (albo skonfiguruj klucz API na hoście gateway), a następnie zweryfikuj za pomocą `openclaw models status`.
  </Accordion>

  <Accordion title='No credentials found for profile "anthropic:default"'>
    Uruchom `openclaw models status`, aby sprawdzić, który profil uwierzytelniania jest aktywny. Uruchom ponownie onboarding albo skonfiguruj klucz API dla ścieżki tego profilu.
  </Accordion>

  <Accordion title="No available auth profile (all in cooldown)">
    Sprawdź `openclaw models status --json` pod kątem `auth.unusableProfiles`. Okresy cooldown limitów szybkości Anthropic mogą być ograniczone do modelu, więc pokrewny model Anthropic może nadal być używalny. Dodaj kolejny profil Anthropic albo poczekaj na zakończenie cooldown.
  </Accordion>
</AccordionGroup>

<Note>
Więcej pomocy: [Rozwiązywanie problemów](/pl/help/troubleshooting) i [FAQ](/pl/help/faq).
</Note>

## Powiązane

<CardGroup cols={2}>
  <Card title="Model selection" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="CLI backends" href="/pl/gateway/cli-backends" icon="terminal">
    Szczegóły konfiguracji i działania backendu Claude CLI.
  </Card>
  <Card title="Prompt caching" href="/pl/reference/prompt-caching" icon="database">
    Jak buforowanie promptów działa u różnych dostawców.
  </Card>
  <Card title="OAuth and auth" href="/pl/gateway/authentication" icon="key">
    Szczegóły uwierzytelniania i reguły ponownego użycia poświadczeń.
  </Card>
</CardGroup>
