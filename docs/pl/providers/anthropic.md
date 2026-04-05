---
read_when:
    - Chcesz używać modeli Anthropic w OpenClaw
    - Chcesz ponownie użyć uwierzytelniania subskrypcji Claude CLI na hoście Gateway
summary: Używaj Anthropic Claude przez klucze API lub Claude CLI w OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-05T14:03:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80f2b614eba4563093522e5157848fc54a16770a2fae69f17c54f1b9bfff624f
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic tworzy rodzinę modeli **Claude** i udostępnia do nich dostęp przez API.
W OpenClaw nowa konfiguracja Anthropic powinna używać klucza API albo lokalnego
backendu Claude CLI. Istniejące starsze profile tokenów Anthropic są nadal
obsługiwane w runtime, jeśli są już skonfigurowane.

<Warning>
Publiczna dokumentacja Claude Code od Anthropic wprost opisuje nieinteraktywne
użycie CLI, takie jak `claude -p`. Na podstawie tej dokumentacji uważamy, że
lokalny, zarządzany przez użytkownika fallback Claude Code CLI jest
prawdopodobnie dozwolony.

Osobno Anthropic powiadomił użytkowników OpenClaw **4 kwietnia 2026 o 12:00 PT /
20:00 BST**, że **OpenClaw jest traktowany jako third-party harness**. Według
ich polityki ruch Claude-login wywoływany przez OpenClaw nie korzysta już z
wliczonej puli subskrypcji Claude i zamiast tego wymaga **Extra Usage**
(pay-as-you-go, rozliczanego oddzielnie od subskrypcji).

To rozróżnienie polityki dotyczy **ponownego użycia Claude CLI wywoływanego przez
OpenClaw**, a nie uruchamiania `claude` bezpośrednio we własnym terminalu. Mimo
to polityka Anthropic dotycząca third-party harness nadal pozostawia dość
niejasności wokół użycia opartego na subskrypcji w produktach zewnętrznych, więc
nie zalecamy tej ścieżki do zastosowań produkcyjnych.

Aktualna publiczna dokumentacja Anthropic:

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)

- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

Jeśli chcesz mieć najjaśniejszą ścieżkę rozliczeń, użyj zamiast tego klucza API Anthropic.
OpenClaw obsługuje też inne opcje w stylu subskrypcyjnym, w tym [OpenAI
Codex](/providers/openai), [Qwen Cloud Coding Plan](/providers/qwen),
[MiniMax Coding Plan](/providers/minimax) i [Z.AI / GLM Coding
Plan](/providers/glm).
</Warning>

## Opcja A: klucz API Anthropic

**Najlepsze dla:** standardowego dostępu do API i rozliczeń według użycia.
Utwórz swój klucz API w Anthropic Console.

### Konfiguracja CLI

```bash
openclaw onboard
# wybierz: Anthropic API key

# lub nieinteraktywnie
openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
```

### Fragment konfiguracji Claude CLI

```json5
{
  env: { ANTHROPIC_API_KEY: "sk-ant-..." },
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Domyślne ustawienia thinking (Claude 4.6)

- Modele Anthropic Claude 4.6 domyślnie używają `adaptive` thinking w OpenClaw, gdy nie ustawiono jawnie poziomu thinking.
- Możesz to nadpisać dla pojedynczej wiadomości (`/think:<level>`) albo w parametrach modelu:
  `agents.defaults.models["anthropic/<model>"].params.thinking`.
- Powiązana dokumentacja Anthropic:
  - [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
  - [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

## Tryb fast (Anthropic API)

Wspólny przełącznik `/fast` w OpenClaw obsługuje też bezpośredni publiczny ruch Anthropic, w tym żądania uwierzytelnione kluczem API i OAuth wysyłane do `api.anthropic.com`.

- `/fast on` mapuje się na `service_tier: "auto"`
- `/fast off` mapuje się na `service_tier: "standard_only"`
- Domyślna konfiguracja:

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

Ważne ograniczenia:

- OpenClaw wstrzykuje poziomy usługi Anthropic tylko dla bezpośrednich żądań do `api.anthropic.com`. Jeśli kierujesz `anthropic/*` przez proxy lub Gateway, `/fast` pozostawia `service_tier` bez zmian.
- Jawne parametry modelu Anthropic `serviceTier` lub `service_tier` mają pierwszeństwo przed domyślnym `/fast`, jeśli ustawione są oba.
- Anthropic raportuje efektywny poziom w odpowiedzi pod `usage.service_tier`. Na kontach bez pojemności Priority Tier wartość `service_tier: "auto"` może nadal zostać rozstrzygnięta jako `standard`.

## Cache promptów (Anthropic API)

OpenClaw obsługuje funkcję cache promptów Anthropic. Jest to **tylko dla API**; starsze uwierzytelnianie tokenem Anthropic nie respektuje ustawień cache.

### Konfiguracja

Użyj parametru `cacheRetention` w konfiguracji modelu:

| Wartość | Czas cache     | Opis                     |
| ------- | -------------- | ------------------------ |
| `none`  | Brak cache     | Wyłącz cache promptów    |
| `short` | 5 minut        | Domyślnie dla uwierzytelniania API Key |
| `long`  | 1 godzina      | Rozszerzony cache        |

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

### Wartości domyślne

Przy użyciu uwierzytelniania Anthropic API Key OpenClaw automatycznie stosuje `cacheRetention: "short"` (5-minutowy cache) dla wszystkich modeli Anthropic. Możesz to nadpisać, jawnie ustawiając `cacheRetention` w konfiguracji.

### Nadpisania `cacheRetention` dla poszczególnych agentów

Użyj parametrów na poziomie modelu jako wartości bazowej, a następnie nadpisuj konkretne agenty przez `agents.list[].params`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-6" },
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" }, // wartość bazowa dla większości agentów
        },
      },
    },
    list: [
      { id: "research", default: true },
      { id: "alerts", params: { cacheRetention: "none" } }, // nadpisanie tylko dla tego agenta
    ],
  },
}
```

Kolejność scalania konfiguracji dla parametrów związanych z cache:

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params` (pasujące `id`, nadpisanie według klucza)

Dzięki temu jeden agent może zachować długotrwały cache, podczas gdy inny agent na tym samym modelu wyłączy cache, aby uniknąć kosztów zapisu przy skokowym ruchu o niskim poziomie ponownego użycia.

### Uwagi dotyczące Bedrock Claude

- Modele Anthropic Claude w Bedrock (`amazon-bedrock/*anthropic.claude*`) akceptują przekazanie `cacheRetention`, jeśli jest skonfigurowane.
- Dla modeli Bedrock innych niż Anthropic runtime wymusza `cacheRetention: "none"`.
- Inteligentne wartości domyślne Anthropic API key ustawiają też `cacheRetention: "short"` dla referencji modeli Claude-on-Bedrock, gdy nie ustawiono jawnej wartości.

## Okno kontekstu 1M (beta Anthropic)

Okno kontekstu 1M od Anthropic jest dostępne tylko w ramach beta-gating. W OpenClaw włączasz je per model
przez `params.context1m: true` dla obsługiwanych modeli Opus/Sonnet.

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

OpenClaw mapuje to na `anthropic-beta: context-1m-2025-08-07` w żądaniach
Anthropic.

Aktywuje się to tylko wtedy, gdy `params.context1m` jest jawnie ustawione na `true`
dla danego modelu.

Wymaganie: Anthropic musi zezwalać na użycie długiego kontekstu dla tych poświadczeń
(zwykle rozliczanie kluczem API albo ścieżka Claude-login OpenClaw / starsze uwierzytelnianie tokenem
z włączonym Extra Usage). W przeciwnym razie Anthropic zwraca:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

Uwaga: Anthropic obecnie odrzuca żądania beta `context-1m-*` przy użyciu
starszego uwierzytelniania tokenem Anthropic (`sk-ant-oat-*`). Jeśli skonfigurujesz
`context1m: true` z tym starszym trybem uwierzytelniania, OpenClaw zapisze ostrzeżenie
i wróci do standardowego okna kontekstu, pomijając nagłówek beta context1m
przy jednoczesnym zachowaniu wymaganych wersji beta OAuth.

## Opcja B: Claude CLI jako provider wiadomości

**Najlepsze dla:** hosta Gateway dla jednego użytkownika, który ma już zainstalowane
i zalogowane Claude CLI, jako lokalny fallback zamiast zalecanej ścieżki produkcyjnej.

Uwaga dotycząca rozliczeń: Uważamy, że fallback Claude Code CLI jest prawdopodobnie dozwolony dla lokalnej,
zarządzanej przez użytkownika automatyzacji na podstawie publicznej dokumentacji CLI Anthropic. Mimo to
polityka Anthropic dotycząca third-party harness tworzy wystarczająco dużo niejasności wokół
użycia opartego na subskrypcji w produktach zewnętrznych, że nie zalecamy tego w środowisku
produkcyjnym. Anthropic poinformował też użytkowników OpenClaw, że użycie Claude
CLI **wywoływane przez OpenClaw** jest traktowane jako ruch third-party harness i od **4 kwietnia 2026
o 12:00 PT / 20:00 BST** wymaga **Extra Usage** zamiast
wliczonych limitów subskrypcji Claude.

Ta ścieżka używa lokalnego binarium `claude` do inferencji modelu zamiast bezpośredniego wywoływania
API Anthropic. OpenClaw traktuje to jako **provider backendu CLI**
z referencjami modeli takimi jak:

- `claude-cli/claude-sonnet-4-6`
- `claude-cli/claude-opus-4-6`

Jak to działa:

1. OpenClaw uruchamia `claude -p --output-format stream-json --include-partial-messages ...`
   na **hoście Gateway** i wysyła prompt przez stdin.
2. Pierwsza tura wysyła `--session-id <uuid>`.
3. Kolejne tury ponownie używają zapisanej sesji Claude przez `--resume <sessionId>`.
4. Twoje wiadomości czatu nadal przechodzą przez normalny pipeline wiadomości OpenClaw, ale
   faktyczna odpowiedź modelu jest generowana przez Claude CLI.

### Wymagania

- Claude CLI zainstalowane na hoście Gateway i dostępne w PATH albo skonfigurowane
  z bezwzględną ścieżką polecenia.
- Claude CLI już uwierzytelnione na tym samym hoście:

```bash
claude auth status
```

- OpenClaw automatycznie ładuje zbundlowany plugin Anthropic podczas uruchamiania Gateway, gdy
  konfiguracja jawnie odwołuje się do `claude-cli/...` lub konfiguracji backendu `claude-cli`.

### Fragment konfiguracji

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "claude-cli/claude-sonnet-4-6",
      },
      models: {
        "claude-cli/claude-sonnet-4-6": {},
      },
      sandbox: { mode: "off" },
    },
  },
}
```

Jeśli binarium `claude` nie znajduje się w PATH hosta Gateway:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

### Co otrzymujesz

- Ponowne użycie uwierzytelniania subskrypcji Claude z lokalnego CLI (odczytywane w runtime, bez trwałego zapisu)
- Normalne routowanie wiadomości/sesji OpenClaw
- Ciągłość sesji Claude CLI między turami (unieważniana przy zmianach uwierzytelniania)
- Narzędzia Gateway udostępniane Claude CLI przez most MCP local loopback
- Strumieniowanie JSONL z postępem wiadomości częściowych na żywo

### Migracja z uwierzytelniania Anthropic do Claude CLI

Jeśli obecnie używasz `anthropic/...` ze starszym profilem tokenu albo kluczem API i chcesz
przełączyć ten sam host Gateway na Claude CLI, OpenClaw obsługuje to jako zwykłą
ścieżkę migracji uwierzytelniania providera.

Wymagania wstępne:

- Claude CLI zainstalowane na **tym samym hoście Gateway**, na którym działa OpenClaw
- Claude CLI już tam zalogowane: `claude auth login`

Następnie uruchom:

```bash
openclaw models auth login --provider anthropic --method cli --set-default
```

Albo w onboardingu:

```bash
openclaw onboard --auth-choice anthropic-cli
```

Interaktywne `openclaw onboard` i `openclaw configure` teraz preferują najpierw **Anthropic
Claude CLI**, a dopiero potem **Anthropic API key**.

Co to robi:

- weryfikuje, że Claude CLI jest już zalogowane na hoście Gateway
- przełącza model domyślny na `claude-cli/...`
- przepisuje domyślne fallbacki modeli Anthropic, takie jak `anthropic/claude-opus-4-6`,
  na `claude-cli/claude-opus-4-6`
- dodaje pasujące wpisy `claude-cli/...` do `agents.defaults.models`

Szybka weryfikacja:

```bash
openclaw models status
```

Powinieneś zobaczyć rozwiązany model główny pod `claude-cli/...`.

Czego to **nie** robi:

- nie usuwa istniejących profili uwierzytelniania Anthropic
- nie usuwa każdego starego odwołania do konfiguracji `anthropic/...` poza główną domyślną
  ścieżką modelu/listy dozwolonych

To upraszcza rollback: w razie potrzeby zmień model domyślny z powrotem na `anthropic/...`.

### Ważne ograniczenia

- To **nie** jest provider API Anthropic. To lokalny runtime CLI.
- OpenClaw nie wstrzykuje bezpośrednio wywołań narzędzi. Claude CLI otrzymuje narzędzia Gateway
  przez most MCP local loopback (`bundleMcp: true`, domyślnie).
- Claude CLI strumieniuje odpowiedzi przez JSONL (`stream-json` z
  `--include-partial-messages`). Prompty są wysyłane przez stdin, a nie argv.
- Uwierzytelnianie jest odczytywane w runtime z aktywnych poświadczeń Claude CLI i nie jest trwale zapisywane
  w profilach OpenClaw. Monity pęku kluczy są wyciszane w kontekstach nieinteraktywnych.
- Ponowne użycie sesji jest śledzone przez metadane `cliSessionBinding`. Gdy stan logowania Claude CLI się zmienia
  (ponowne logowanie, rotacja tokenu), zapisane sesje są
  unieważniane i rozpoczyna się nowa sesja.
- Najlepiej nadaje się do osobistego hosta Gateway, a nie do współdzielonych konfiguracji rozliczeń dla wielu użytkowników.

Więcej szczegółów: [/gateway/cli-backends](/pl/gateway/cli-backends)

## Uwagi

- Publiczna dokumentacja Claude Code od Anthropic nadal opisuje bezpośrednie użycie CLI, takie jak
  `claude -p`. Uważamy, że lokalny fallback zarządzany przez użytkownika jest prawdopodobnie dozwolony, ale
  osobne powiadomienie Anthropic dla użytkowników OpenClaw mówi, że ścieżka logowania Claude w **OpenClaw**
  jest użyciem third-party harness i wymaga **Extra Usage**
  (pay-as-you-go rozliczanego oddzielnie od subskrypcji). Do zastosowań produkcyjnych
  zalecamy zamiast tego klucze API Anthropic.
- Anthropic setup-token jest ponownie dostępny w OpenClaw jako starsza/ręczna ścieżka. Powiadomienie Anthropic dotyczące rozliczeń specyficznych dla OpenClaw nadal obowiązuje, więc używaj tej opcji ze świadomością, że Anthropic wymaga **Extra Usage** dla tej ścieżki.
- Szczegóły uwierzytelniania i reguły ponownego użycia znajdziesz w [/concepts/oauth](/pl/concepts/oauth).

## Rozwiązywanie problemów

**Błędy 401 / token nagle nieważny**

- Starsze uwierzytelnianie tokenem Anthropic może wygasnąć lub zostać cofnięte.
- W przypadku nowej konfiguracji przejdź na klucz API Anthropic albo lokalną ścieżkę Claude CLI na hoście Gateway.

**Nie znaleziono klucza API dla providera "anthropic"**

- Uwierzytelnianie jest **per agent**. Nowi agenci nie dziedziczą kluczy głównego agenta.
- Ponownie uruchom onboarding dla tego agenta albo skonfiguruj klucz API na hoście Gateway,
  a następnie zweryfikuj przez `openclaw models status`.

**Nie znaleziono poświadczeń dla profilu `anthropic:default`**

- Uruchom `openclaw models status`, aby sprawdzić, który profil uwierzytelniania jest aktywny.
- Ponownie uruchom onboarding albo skonfiguruj klucz API lub Claude CLI dla tej ścieżki profilu.

**Brak dostępnego profilu uwierzytelniania (wszystkie w cooldown/niedostępne)**

- Sprawdź `openclaw models status --json` pod kątem `auth.unusableProfiles`.
- Cooldowny limitu szybkości Anthropic mogą być zależne od modelu, więc pokrewny model Anthropic
  może nadal być używalny, nawet gdy bieżący jest w cooldown.
- Dodaj kolejny profil Anthropic albo poczekaj na koniec cooldown.

Więcej: [/gateway/troubleshooting](/pl/gateway/troubleshooting) i [/help/faq](/help/faq).
