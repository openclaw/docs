---
read_when:
    - Chcesz używać modeli Anthropic w OpenClaw
summary: Używaj Anthropic Claude w OpenClaw za pomocą kluczy API lub Claude CLI
title: Anthropic
x-i18n:
    generated_at: "2026-05-07T13:23:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15ae1d2751d0127a45ece3d0a25bead21fd6bacc2ffc80636188fc2cb5f3d7ce
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

W przypadku długotrwale działających hostów gateway klucze API Anthropic nadal są najjaśniejszą i
najbardziej przewidywalną ścieżką produkcyjną.

Aktualna publiczna dokumentacja Anthropic:

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Pierwsze kroki

<Tabs>
  <Tab title="Klucz API">
    **Najlepsze do:** standardowego dostępu API i rozliczania według użycia.

    <Steps>
      <Step title="Uzyskaj klucz API">
        Utwórz klucz API w [konsoli Anthropic](https://console.anthropic.com/).
      </Step>
      <Step title="Uruchom onboarding">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        Lub przekaż klucz bezpośrednio:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Zweryfikuj, czy model jest dostępny">
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
        Zweryfikuj za pomocą:

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
      <Step title="Zweryfikuj, czy model jest dostępny">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Szczegóły konfiguracji i działania backendu Claude CLI znajdują się w [backendach CLI](/pl/gateway/cli-backends).
    </Note>

    ### Przykład konfiguracji

    Preferuj kanoniczne odwołanie do modelu Anthropic oraz nadpisanie środowiska wykonawczego CLI:

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

    Starsze odwołania do modeli `claude-cli/claude-opus-4-7` nadal działają ze względu na
    zgodność, ale nowa konfiguracja powinna utrzymywać wybór dostawcy/modelu jako
    `anthropic/*`, a backend wykonawczy umieszczać w `agentRuntime.id`.

    <Tip>
    Jeśli chcesz najjaśniejszą ścieżkę rozliczeń, użyj zamiast tego klucza API Anthropic. OpenClaw obsługuje również opcje w stylu subskrypcji od [OpenAI Codex](/pl/providers/openai), [Qwen Cloud](/pl/providers/qwen), [MiniMax](/pl/providers/minimax) i [Z.AI / GLM](/pl/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Domyślne myślenie (Claude 4.6)

Modele Claude 4.6 domyślnie używają myślenia `adaptive` w OpenClaw, gdy nie ustawiono jawnego poziomu myślenia.

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
- [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Buforowanie promptów

OpenClaw obsługuje funkcję buforowania promptów Anthropic dla uwierzytelniania kluczem API.

| Wartość             | Czas trwania pamięci podręcznej | Opis                                           |
| ------------------- | ------------------------------- | ---------------------------------------------- |
| `"short"` (domyślnie) | 5 minut                       | Stosowane automatycznie dla uwierzytelniania kluczem API |
| `"long"`            | 1 godzina                       | Rozszerzona pamięć podręczna                   |
| `"none"`            | Bez buforowania                 | Wyłącza buforowanie promptów                   |

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
    2. `agents.list[].params` (dopasowanie `id`, nadpisuje według klucza)

    Dzięki temu jeden agent może utrzymywać długotrwałą pamięć podręczną, podczas gdy inny agent na tym samym modelu wyłącza buforowanie dla skokowego ruchu o niskim ponownym użyciu.

  </Accordion>

  <Accordion title="Uwagi dotyczące Bedrock Claude">
    - Modele Anthropic Claude w Bedrock (`amazon-bedrock/*anthropic.claude*`) akceptują przekazywanie `cacheRetention`, gdy jest skonfigurowane.
    - Modele Bedrock inne niż Anthropic są w czasie działania wymuszane na `cacheRetention: "none"`.
    - Inteligentne wartości domyślne klucza API także ustawiają początkowo `cacheRetention: "short"` dla odwołań Claude-on-Bedrock, gdy nie ustawiono jawnej wartości.

  </Accordion>
</AccordionGroup>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Tryb szybki">
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
    - Jawne parametry `serviceTier` lub `service_tier` nadpisują `/fast`, gdy oba są ustawione.
    - Na kontach bez pojemności Priority Tier `service_tier: "auto"` może zostać rozstrzygnięte jako `standard`.

    </Note>

  </Accordion>

  <Accordion title="Rozumienie multimediów (obraz i PDF)">
    Dołączony plugin Anthropic rejestruje rozumienie obrazów i PDF. OpenClaw
    automatycznie rozpoznaje możliwości multimedialne na podstawie skonfigurowanego uwierzytelniania Anthropic — dodatkowa
    konfiguracja nie jest potrzebna.

    | Właściwość      | Wartość               |
    | --------------- | --------------------- |
    | Model domyślny  | `claude-opus-4-7`     |
    | Obsługiwane dane wejściowe | Obrazy, dokumenty PDF |

    Gdy do rozmowy dołączony jest obraz lub PDF, OpenClaw automatycznie
    kieruje go przez dostawcę rozumienia multimediów Anthropic.

  </Accordion>

  <Accordion title="Okno kontekstu 1M (beta)">
    Okno kontekstu 1M Anthropic jest bramkowane wersją beta. Włącz je dla modelu:

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

    OpenClaw mapuje to na `anthropic-beta: context-1m-2025-08-07` w żądaniach.

    `params.context1m: true` dotyczy również backendu Claude CLI
    (`claude-cli/*`) dla kwalifikujących się modeli Opus i Sonnet, rozszerzając okno
    kontekstu środowiska wykonawczego dla tych sesji CLI tak, aby odpowiadało zachowaniu bezpośredniego API.

    <Warning>
    Wymaga dostępu do długiego kontekstu w Twoich poświadczeniach Anthropic. Starsze uwierzytelnianie tokenem (`sk-ant-oat-*`) jest odrzucane dla żądań kontekstu 1M — OpenClaw zapisuje ostrzeżenie w logu i wraca do standardowego okna kontekstu.
    </Warning>

  </Accordion>

  <Accordion title="Kontekst 1M Claude Opus 4.7">
    `anthropic/claude-opus-4.7` i jego wariant `claude-cli` mają domyślnie okno
    kontekstu 1M — `params.context1m: true` nie jest potrzebne.
  </Accordion>
</AccordionGroup>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Błędy 401 / token nagle jest nieprawidłowy">
    Uwierzytelnianie tokenem Anthropic wygasa i może zostać unieważnione. W nowych konfiguracjach użyj zamiast tego klucza API Anthropic.
  </Accordion>

  <Accordion title='Nie znaleziono klucza API dla dostawcy "anthropic"'>
    Uwierzytelnianie Anthropic jest **osobne dla każdego agenta** — nowi agenci nie dziedziczą kluczy głównego agenta. Uruchom ponownie onboarding dla tego agenta (albo skonfiguruj klucz API na hoście gateway), a następnie zweryfikuj za pomocą `openclaw models status`.
  </Accordion>

  <Accordion title='Nie znaleziono poświadczeń dla profilu "anthropic:default"'>
    Uruchom `openclaw models status`, aby zobaczyć, który profil uwierzytelniania jest aktywny. Uruchom ponownie onboarding albo skonfiguruj klucz API dla tej ścieżki profilu.
  </Accordion>

  <Accordion title="Brak dostępnego profilu uwierzytelniania (wszystkie w okresie cooldown)">
    Sprawdź `openclaw models status --json` pod kątem `auth.unusableProfiles`. Okresy cooldown limitów szybkości Anthropic mogą być ograniczone do modelu, więc pokrewny model Anthropic nadal może być użyteczny. Dodaj kolejny profil Anthropic albo poczekaj na zakończenie cooldown.
  </Accordion>
</AccordionGroup>

<Note>
Więcej pomocy: [Rozwiązywanie problemów](/pl/help/troubleshooting) i [FAQ](/pl/help/faq).
</Note>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Backendy CLI" href="/pl/gateway/cli-backends" icon="terminal">
    Szczegóły konfiguracji i działania backendu Claude CLI.
  </Card>
  <Card title="Buforowanie promptów" href="/pl/reference/prompt-caching" icon="database">
    Jak działa buforowanie promptów u różnych dostawców.
  </Card>
  <Card title="OAuth i uwierzytelnianie" href="/pl/gateway/authentication" icon="key">
    Szczegóły uwierzytelniania i reguły ponownego użycia poświadczeń.
  </Card>
</CardGroup>
