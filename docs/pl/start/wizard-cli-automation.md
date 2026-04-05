---
read_when:
    - Automatyzujesz onboarding w skryptach lub CI
    - Potrzebujesz nieinteraktywnych przykładów dla konkretnych dostawców
sidebarTitle: CLI automation
summary: Skryptowy onboarding i konfiguracja agenta dla CLI OpenClaw
title: Automatyzacja CLI
x-i18n:
    generated_at: "2026-04-05T14:06:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: a757d58df443e5e71f97417aed20e6a80a63b84f69f7dbf0e093319827d37836
    source_path: start/wizard-cli-automation.md
    workflow: 15
---

# Automatyzacja CLI

Użyj `--non-interactive`, aby zautomatyzować `openclaw onboard`.

<Note>
`--json` nie oznacza trybu nieinteraktywnego. W skryptach używaj `--non-interactive` (oraz `--workspace`).
</Note>

## Podstawowy przykład nieinteraktywny

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --secret-input-mode plaintext \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

Dodaj `--json`, aby uzyskać podsumowanie w formacie czytelnym maszynowo.

Użyj `--secret-input-mode ref`, aby zapisywać referencje oparte na env w auth profiles zamiast wartości w postaci jawnego tekstu.
Interaktywny wybór między referencjami env a skonfigurowanymi referencjami dostawcy (`file` lub `exec`) jest dostępny w przepływie onboardingu.

W nieinteraktywnym trybie `ref` zmienne środowiskowe dostawcy muszą być ustawione w środowisku procesu.
Przekazywanie inline flag z kluczami bez odpowiadającej im zmiennej env kończy się teraz szybkim błędem.

Przykład:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

## Przykłady specyficzne dla dostawców

<AccordionGroup>
  <Accordion title="Przykład Anthropic Claude CLI">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice anthropic-cli \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    Wymaga, aby Claude CLI było już zainstalowane i zalogowane na tym samym
    hoście gateway.

  </Accordion>
  <Accordion title="Przykład Gemini">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Przykład Z.AI">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Przykład Vercel AI Gateway">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Przykład Cloudflare AI Gateway">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice cloudflare-ai-gateway-api-key \
      --cloudflare-ai-gateway-account-id "your-account-id" \
      --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
      --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Przykład Moonshot">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Przykład Mistral">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Przykład Synthetic">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Przykład OpenCode">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
    Zmień na `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` dla katalogu Go.
  </Accordion>
  <Accordion title="Przykład Ollama">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ollama \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Przykład custom provider">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --custom-api-key "$CUSTOM_API_KEY" \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    `--custom-api-key` jest opcjonalne. Jeśli go nie podasz, onboarding sprawdzi `CUSTOM_API_KEY`.

    Wariant trybu ref:

    ```bash
    export CUSTOM_API_KEY="your-key"
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --secret-input-mode ref \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    W tym trybie onboarding zapisuje `apiKey` jako `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.

  </Accordion>
</AccordionGroup>

Anthropic setup-token jest ponownie dostępny jako starsza/ręczna ścieżka onboardingu.
Używaj go z założeniem, że Anthropic poinformował użytkowników OpenClaw, że ścieżka
logowania Claude w OpenClaw wymaga **Extra Usage**. Dla środowiska produkcyjnego preferuj
klucz API Anthropic.

## Dodaj kolejnego agenta

Użyj `openclaw agents add <name>`, aby utworzyć osobnego agenta z własnym workspace,
sesjami i auth profiles. Uruchomienie bez `--workspace` uruchamia kreator.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

Co to ustawia:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Uwagi:

- Domyślne workspace mają postać `~/.openclaw/workspace-<agentId>`.
- Dodaj `bindings`, aby routować wiadomości przychodzące (kreator potrafi to zrobić).
- Flagi nieinteraktywne: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Powiązana dokumentacja

- Hub onboardingu: [Onboarding (CLI)](/start/wizard)
- Pełne odniesienie: [CLI Setup Reference](/start/wizard-cli-reference)
- Odniesienie do polecenia: [`openclaw onboard`](/cli/onboard)
