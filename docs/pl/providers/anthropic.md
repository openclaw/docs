---
read_when:
    - Chcesz używać modeli Anthropic w OpenClaw
summary: Używaj Anthropic Claude przez klucze API lub Claude CLI w OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-07T09:48:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 423928fd36c66729985208d4d3f53aff1f94f63b908df85072988bdc41d5cf46
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic tworzy rodzinę modeli **Claude** i udostępnia dostęp przez API oraz
Claude CLI. W OpenClaw obsługiwane są zarówno klucze API Anthropic, jak i ponowne
wykorzystanie Claude CLI. Istniejące starsze profile tokenów Anthropic są nadal
respektowane w runtime, jeśli są już skonfigurowane.

<Warning>
Pracownicy Anthropic powiedzieli nam, że użycie Claude CLI w stylu OpenClaw jest ponownie dozwolone, więc
OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako usankcjonowane dla tej
integracji, chyba że Anthropic opublikuje nową politykę.

Dla długotrwale działających hostów gateway klucze API Anthropic nadal są najjaśniejszą i
najbardziej przewidywalną ścieżką produkcyjną. Jeśli już używasz Claude CLI na hoście,
OpenClaw może bezpośrednio wykorzystać to logowanie.

Obecna publiczna dokumentacja Anthropic:

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)

- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

Jeśli chcesz mieć najjaśniejszą ścieżkę rozliczeń, użyj klucza API Anthropic.
OpenClaw obsługuje też inne opcje w stylu subskrypcyjnym, w tym [OpenAI
Codex](/pl/providers/openai), [Qwen Cloud Coding Plan](/pl/providers/qwen),
[MiniMax Coding Plan](/pl/providers/minimax) oraz [Z.AI / GLM Coding
Plan](/pl/providers/glm).
</Warning>

## Opcja A: klucz API Anthropic

**Najlepsze dla:** standardowego dostępu do API i rozliczania według użycia.
Utwórz swój klucz API w Anthropic Console.

### Konfiguracja CLI

```bash
openclaw onboard
# choose: Anthropic API key

# or non-interactive
openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
```

### Fragment konfiguracji Anthropic

```json5
{
  env: { ANTHROPIC_API_KEY: "sk-ant-..." },
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Domyślne ustawienia thinking (Claude 4.6)

- Modele Anthropic Claude 4.6 domyślnie używają `adaptive` thinking w OpenClaw, gdy nie ustawiono jawnie poziomu thinking.
- Możesz to nadpisać dla pojedynczej wiadomości (`/think:<level>`) lub w parametrach modelu:
  `agents.defaults.models["anthropic/<model>"].params.thinking`.
- Powiązana dokumentacja Anthropic:
  - [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
  - [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

## Tryb fast (Anthropic API)

Wspólny przełącznik `/fast` w OpenClaw obsługuje też bezpośredni publiczny ruch Anthropic, w tym żądania uwierzytelniane kluczem API i OAuth wysyłane do `api.anthropic.com`.

- `/fast on` mapuje do `service_tier: "auto"`
- `/fast off` mapuje do `service_tier: "standard_only"`
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

- OpenClaw wstrzykuje poziomy usług Anthropic tylko dla bezpośrednich żądań do `api.anthropic.com`. Jeśli kierujesz `anthropic/*` przez proxy lub gateway, `/fast` pozostawia `service_tier` bez zmian.
- Jawne parametry modelu Anthropic `serviceTier` lub `service_tier` mają pierwszeństwo przed domyślnym `/fast`, gdy ustawiono oba.
- Anthropic raportuje efektywny poziom w odpowiedzi pod `usage.service_tier`. Na kontach bez pojemności Priority Tier wartość `service_tier: "auto"` może nadal rozwiązać się do `standard`.

## Prompt caching (Anthropic API)

OpenClaw obsługuje funkcję prompt caching od Anthropic. To jest **tylko dla API**; starsze uwierzytelnianie tokenami Anthropic nie respektuje ustawień cache.

### Konfiguracja

Użyj parametru `cacheRetention` w konfiguracji modelu:

| Value   | Czas trwania cache | Opis                         |
| ------- | ------------------ | ---------------------------- |
| `none`  | Brak cache         | Wyłącza prompt caching       |
| `short` | 5 minut            | Domyślnie dla auth API Key   |
| `long`  | 1 godzina          | Rozszerzony cache            |

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

Gdy używasz uwierzytelniania kluczem API Anthropic, OpenClaw automatycznie stosuje `cacheRetention: "short"` (5-minutowy cache) dla wszystkich modeli Anthropic. Możesz to nadpisać, jawnie ustawiając `cacheRetention` w swojej konfiguracji.

### Nadpisania cacheRetention per agent

Użyj parametrów na poziomie modelu jako bazowego ustawienia, a następnie nadpisuj konkretne agenty przez `agents.list[].params`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-6" },
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" }, // baseline for most agents
        },
      },
    },
    list: [
      { id: "research", default: true },
      { id: "alerts", params: { cacheRetention: "none" } }, // override for this agent only
    ],
  },
}
```

Kolejność scalania konfiguracji dla parametrów związanych z cache:

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params` (pasujące `id`, nadpisuje według klucza)

Dzięki temu jeden agent może zachować długotrwały cache, podczas gdy inny agent na tym samym modelu wyłącza cache, aby uniknąć kosztów zapisu przy ruchu skokowym lub o małym poziomie ponownego użycia.

### Uwagi o Bedrock Claude

- Modele Anthropic Claude w Bedrock (`amazon-bedrock/*anthropic.claude*`) akceptują przekazywanie `cacheRetention`, jeśli jest skonfigurowane.
- Modele Bedrock inne niż Anthropic są wymuszane w runtime do `cacheRetention: "none"`.
- Inteligentne wartości domyślne dla kluczy API Anthropic ustawiają także `cacheRetention: "short"` dla odwołań do modeli Claude-on-Bedrock, gdy nie ustawiono jawnej wartości.

## Okno kontekstu 1M (Anthropic beta)

Okno kontekstu 1M Anthropic jest objęte betą. W OpenClaw włącz je per model
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

OpenClaw mapuje to do `anthropic-beta: context-1m-2025-08-07` w żądaniach
Anthropic.

To aktywuje się tylko wtedy, gdy `params.context1m` jest jawnie ustawione na `true` dla
tego modelu.

Wymaganie: Anthropic musi zezwalać na użycie długiego kontekstu dla tych poświadczeń.

Uwaga: Anthropic obecnie odrzuca żądania beta `context-1m-*` przy użyciu
starszego uwierzytelniania tokenami Anthropic (`sk-ant-oat-*`). Jeśli skonfigurujesz
`context1m: true` w tym starszym trybie uwierzytelniania, OpenClaw zapisze ostrzeżenie w logach i
wróci do standardowego okna kontekstu, pomijając nagłówek beta context1m
przy jednoczesnym zachowaniu wymaganych bet OAuth.

## Backend Claude CLI

Dołączony backend Anthropic `claude-cli` jest obsługiwany w OpenClaw.

- Pracownicy Anthropic powiedzieli nam, że to użycie jest ponownie dozwolone.
- OpenClaw dlatego traktuje ponowne użycie Claude CLI i użycie `claude -p` jako
  usankcjonowane dla tej integracji, chyba że Anthropic opublikuje nową politykę.
- Klucze API Anthropic pozostają najjaśniejszą ścieżką produkcyjną dla stale działających hostów gateway
  oraz jawnej kontroli rozliczeń po stronie serwera.
- Szczegóły konfiguracji i runtime znajdują się w [/gateway/cli-backends](/pl/gateway/cli-backends).

## Uwagi

- Publiczna dokumentacja Claude Code Anthropic nadal opisuje bezpośrednie użycie CLI, takie jak
  `claude -p`, a pracownicy Anthropic powiedzieli nam, że użycie Claude CLI w stylu OpenClaw jest
  ponownie dozwolone. Traktujemy te wytyczne jako ustalone, chyba że Anthropic
  opublikuje nową zmianę polityki.
- Anthropic setup-token pozostaje dostępny w OpenClaw jako obsługiwana ścieżka uwierzytelniania tokenem, ale OpenClaw teraz preferuje ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.
- Szczegóły auth + zasady ponownego użycia znajdują się w [/concepts/oauth](/pl/concepts/oauth).

## Rozwiązywanie problemów

**Błędy 401 / token nagle stał się nieprawidłowy**

- Uwierzytelnianie tokenem Anthropic może wygasnąć lub zostać cofnięte.
- Dla nowej konfiguracji przejdź na klucz API Anthropic.

**Nie znaleziono klucza API dla dostawcy "anthropic"**

- Uwierzytelnianie jest **per agent**. Nowi agenci nie dziedziczą kluczy głównego agenta.
- Uruchom onboarding ponownie dla tego agenta albo skonfiguruj klucz API na hoście gateway,
  a następnie zweryfikuj przez `openclaw models status`.

**Nie znaleziono poświadczeń dla profilu `anthropic:default`**

- Uruchom `openclaw models status`, aby zobaczyć, który profil uwierzytelniania jest aktywny.
- Uruchom onboarding ponownie albo skonfiguruj klucz API dla ścieżki tego profilu.

**Brak dostępnego profilu uwierzytelniania (wszystkie w cooldown/niedostępne)**

- Sprawdź `openclaw models status --json` dla `auth.unusableProfiles`.
- Cooldowny limitów Anthropic mogą być ograniczone do konkretnego modelu, więc pokrewny model Anthropic
  może nadal być użyteczny nawet wtedy, gdy bieżący jest w cooldownie.
- Dodaj kolejny profil Anthropic albo poczekaj na koniec cooldownu.

Więcej: [/gateway/troubleshooting](/pl/gateway/troubleshooting) oraz [/help/faq](/pl/help/faq).
