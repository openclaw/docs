---
read_when:
    - Chcesz używać modeli Anthropic w OpenClaw
summary: Używaj Anthropic Claude za pomocą kluczy API lub Claude CLI w OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-26T11:39:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: f26f117cb4f98790c323e056d39267c18f1278b0a7a8d3d43a7cbaddbb4523c1
    source_path: providers/anthropic.md
    workflow: 15
---

Anthropic tworzy rodzinę modeli **Claude**. OpenClaw obsługuje dwie ścieżki uwierzytelniania:

- **Klucz API** — bezpośredni dostęp do API Anthropic z rozliczaniem zależnym od użycia (modele `anthropic/*`)
- **Claude CLI** — ponowne użycie istniejącego logowania Claude CLI na tym samym hoście

<Warning>
Pracownicy Anthropic poinformowali nas, że użycie Claude CLI w stylu OpenClaw jest ponownie dozwolone, więc OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako zatwierdzone, dopóki Anthropic nie opublikuje nowej polityki.

Dla długotrwale działających hostów Gateway klucze API Anthropic pozostają nadal najjaśniejszą i najbardziej przewidywalną ścieżką produkcyjną.

Aktualna publiczna dokumentacja Anthropic:

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Pierwsze kroki

<Tabs>
  <Tab title="Klucz API">
    **Najlepsze do:** standardowego dostępu do API i rozliczania zależnego od użycia.

    <Steps>
      <Step title="Pobierz klucz API">
        Utwórz klucz API w [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Uruchom wdrożenie">
        ```bash
        openclaw onboard
        # wybierz: Anthropic API key
        ```

        Lub przekaż klucz bezpośrednio:

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
        Zweryfikuj poleceniem:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Uruchom wdrożenie">
        ```bash
        openclaw onboard
        # wybierz: Claude CLI
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

    ### Przykład konfiguracji

    Preferuj kanoniczne odwołanie do modelu Anthropic wraz z nadpisaniem runtime CLI:

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

    Starsze odwołania do modeli `claude-cli/claude-opus-4-7` nadal działają ze względu na zgodność, ale nowa konfiguracja powinna zachować wybór dostawcy/modelu jako `anthropic/*`, a backend wykonania umieścić w `agentRuntime.id`.

    <Tip>
    Jeśli chcesz mieć najjaśniejszą ścieżkę rozliczania, użyj zamiast tego klucza API Anthropic. OpenClaw obsługuje też opcje abonamentowe z [OpenAI Codex](/pl/providers/openai), [Qwen Cloud](/pl/providers/qwen), [MiniMax](/pl/providers/minimax) i [Z.AI / GLM](/pl/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Domyślne ustawienia thinking (Claude 4.6)

Modele Claude 4.6 domyślnie używają w OpenClaw trybu `adaptive` thinking, gdy nie ustawiono jawnie poziomu thinking.

Nadpisz dla pojedynczej wiadomości za pomocą `/think:<level>` lub w parametrach modelu:

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

## Cache promptów

OpenClaw obsługuje funkcję cache promptów Anthropic dla uwierzytelniania kluczem API.

| Wartość             | Czas cache | Opis                                           |
| ------------------- | ---------- | ---------------------------------------------- |
| `"short"` (domyślnie) | 5 minut    | Stosowane automatycznie przy uwierzytelnianiu kluczem API |
| `"long"`            | 1 godzina  | Rozszerzony cache                              |
| `"none"`            | Brak cache | Wyłącza cache promptów                         |

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
  <Accordion title="Nadpisania cache dla pojedynczego agenta">
    Użyj parametrów na poziomie modelu jako podstawy, a następnie nadpisz wybranych agentów przez `agents.list[].params`:

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
    2. `agents.list[].params` (pasujące `id`, nadpisywanie według klucza)

    Dzięki temu jeden agent może zachować długotrwały cache, podczas gdy inny agent na tym samym modelu wyłączy cache dla ruchu skokowego/o niskim ponownym użyciu.

  </Accordion>

  <Accordion title="Uwagi o Claude na Bedrock">
    - Modele Anthropic Claude w Bedrock (`amazon-bedrock/*anthropic.claude*`) akceptują przekazanie `cacheRetention`, jeśli jest skonfigurowane.
    - Modele Bedrock inne niż Anthropic są w runtime wymuszane na `cacheRetention: "none"`.
    - Inteligentne ustawienia domyślne dla klucza API także ustawiają `cacheRetention: "short"` dla odwołań Claude-on-Bedrock, gdy nie ustawiono jawnej wartości.

  </Accordion>
</AccordionGroup>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Tryb szybki">
    Współdzielony przełącznik `/fast` w OpenClaw obsługuje bezpośredni ruch Anthropic (klucz API i OAuth do `api.anthropic.com`).

    | Polecenie | Mapowanie do |
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
    - Jawne parametry `serviceTier` lub `service_tier` mają pierwszeństwo przed `/fast`, gdy ustawione są oba.
    - Na kontach bez przepustowości Priority Tier `service_tier: "auto"` może zostać rozwiązane jako `standard`.

    </Note>

  </Accordion>

  <Accordion title="Rozumienie mediów (obraz i PDF)">
    Dołączony Plugin Anthropic rejestruje rozumienie obrazów i plików PDF. OpenClaw automatycznie rozwiązuje możliwości obsługi mediów na podstawie skonfigurowanego uwierzytelnienia Anthropic — nie jest potrzebna dodatkowa konfiguracja.

    | Właściwość       | Wartość              |
    | -------------- | -------------------- |
    | Model domyślny  | `claude-opus-4-6`    |
    | Obsługiwane wejście | Obrazy, dokumenty PDF |

    Gdy do rozmowy dołączony jest obraz lub PDF, OpenClaw automatycznie kieruje go przez dostawcę rozumienia mediów Anthropic.

  </Accordion>

  <Accordion title="Okno kontekstu 1M (beta)">
    Okno kontekstu 1M Anthropic jest objęte bramką beta. Włączaj je dla każdego modelu osobno:

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

    `params.context1m: true` dotyczy także backendu Claude CLI (`claude-cli/*`) dla kwalifikujących się modeli Opus i Sonnet, rozszerzając okno kontekstu runtime dla tych sesji CLI tak, aby odpowiadało zachowaniu bezpośredniego API.

    <Warning>
    Wymaga dostępu do długiego kontekstu dla Twoich poświadczeń Anthropic. Starsze uwierzytelnianie tokenem (`sk-ant-oat-*`) jest odrzucane dla żądań z kontekstem 1M — OpenClaw zapisuje ostrzeżenie w logach i wraca do standardowego okna kontekstu.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.7 1M context">
    `anthropic/claude-opus-4.7` i jego wariant `claude-cli` domyślnie mają okno kontekstu 1M — `params.context1m: true` nie jest potrzebne.
  </Accordion>
</AccordionGroup>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Błędy 401 / token nagle stał się nieprawidłowy">
    Uwierzytelnianie tokenem Anthropic wygasa i może zostać cofnięte. Dla nowych konfiguracji użyj zamiast tego klucza API Anthropic.
  </Accordion>

  <Accordion title='Nie znaleziono klucza API dla dostawcy "anthropic"'>
    Uwierzytelnianie Anthropic jest **na agenta** — nowi agenci nie dziedziczą kluczy głównego agenta. Ponownie uruchom wdrożenie dla tego agenta (albo skonfiguruj klucz API na hoście Gateway), a następnie zweryfikuj poleceniem `openclaw models status`.
  </Accordion>

  <Accordion title='Nie znaleziono poświadczeń dla profilu "anthropic:default"'>
    Uruchom `openclaw models status`, aby zobaczyć, który profil uwierzytelniania jest aktywny. Ponownie uruchom wdrożenie albo skonfiguruj klucz API dla ścieżki tego profilu.
  </Accordion>

  <Accordion title="Brak dostępnego profilu uwierzytelniania (wszystkie w cooldown)">
    Sprawdź `openclaw models status --json` pod kątem `auth.unusableProfiles`. Cooldowny limitu szybkości Anthropic mogą być ograniczone do modelu, więc pokrewny model Anthropic może nadal nadawać się do użycia. Dodaj kolejny profil Anthropic albo poczekaj na zakończenie cooldownu.
  </Accordion>
</AccordionGroup>

<Note>
Więcej pomocy: [Rozwiązywanie problemów](/pl/help/troubleshooting) i [FAQ](/pl/help/faq).
</Note>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, odwołań do modeli i zachowania failover.
  </Card>
  <Card title="Backendy CLI" href="/pl/gateway/cli-backends" icon="terminal">
    Konfiguracja backendu Claude CLI i szczegóły runtime.
  </Card>
  <Card title="Cache promptów" href="/pl/reference/prompt-caching" icon="database">
    Jak działa cache promptów u różnych dostawców.
  </Card>
  <Card title="OAuth i uwierzytelnianie" href="/pl/gateway/authentication" icon="key">
    Szczegóły uwierzytelniania i zasady ponownego użycia poświadczeń.
  </Card>
</CardGroup>
