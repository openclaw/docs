---
read_when:
    - Automatyzujesz wdrażanie w skryptach lub CI
    - Potrzebujesz przykładów nieinteraktywnych dla konkretnych dostawców
sidebarTitle: CLI automation
summary: Skryptowe wdrażanie i konfiguracja agenta dla CLI OpenClaw
title: Automatyzacja CLI
x-i18n:
    generated_at: "2026-07-12T15:39:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de3115fd0c675b92f22cf9c44ddd307a854e499c6f163235f991368429b2c152
    source_path: start/wizard-cli-automation.md
    workflow: 16
---

Użyj `openclaw onboard --non-interactive`, aby oskryptować konfigurację. Wymaga to opcji `--accept-risk`: konfiguracja nieinteraktywna może zapisywać dane uwierzytelniające i konfigurację demona bez monitu o potwierdzenie, dlatego ta opcja stanowi wyraźne potwierdzenie akceptacji ryzyka.

<Note>
Opcja `--json` nie włącza trybu nieinteraktywnego. W skryptach jawnie przekaż `--non-interactive --accept-risk`.
</Note>

## Podstawowy przykład konfiguracji nieinteraktywnej

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --secret-input-mode plaintext \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-bootstrap \
  --skip-skills
```

Dodaj `--json`, aby uzyskać podsumowanie w formacie przeznaczonym do przetwarzania maszynowego.

- Domyślna wartość `--gateway-port` to `18789`; przekaż tę opcję tylko wtedy, gdy chcesz ją zastąpić.
- Opcja `--skip-bootstrap` pomija tworzenie domyślnych plików obszaru roboczego na potrzeby automatyzacji, która wstępnie przygotowuje własny obszar roboczy.
- Opcja `--secret-input-mode ref` zapisuje w profilu uwierzytelniania odwołanie oparte na zmiennej środowiskowej (`{ source: "env", provider: "default", id: "<ENV_VAR>" }`) zamiast klucza w postaci zwykłego tekstu. W nieinteraktywnym trybie `ref` zmienna środowiskowa dostawcy musi być już ustawiona w środowisku procesu: przekazanie opcji klucza bezpośrednio w wierszu poleceń bez odpowiadającej jej zmiennej środowiskowej powoduje natychmiastowe niepowodzenie.

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref
```

## Przykłady dla poszczególnych dostawców

<AccordionGroup>
  <Accordion title="Przykład klucza API Anthropic">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Przykład Cloudflare AI Gateway">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice cloudflare-ai-gateway-api-key \
      --cloudflare-ai-gateway-account-id "your-account-id" \
      --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
      --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Przykład Gemini">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Przykład Mistral">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Przykład Moonshot">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Przykład Ollama">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ollama \
      --custom-model-id "qwen3.5:27b" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Przykład OpenCode">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-bind loopback
    ```
    Aby użyć katalogu Go, zastąp tę opcję przez `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"`.
  </Accordion>
  <Accordion title="Przykład Synthetic">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Przykład Vercel AI Gateway">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Przykład Z.AI">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Przykład niestandardowego dostawcy">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --custom-api-key "$CUSTOM_API_KEY" \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --custom-image-input \
      --gateway-bind loopback
    ```

    Opcja `--custom-api-key` jest opcjonalna; niektóre punkty końcowe nie wymagają uwierzytelniania. Jeśli ją pominięto, proces wdrażania sprawdza zmienną `CUSTOM_API_KEY` w środowisku. Opcja `--custom-provider-id` jest opcjonalna, a po jej pominięciu identyfikator jest automatycznie wyprowadzany z bazowego adresu URL. Domyślna wartość `--custom-compatibility` to `openai` (pozostałe wartości: `openai-responses`, `anthropic`).

    OpenClaw rozpoznaje obsługę danych wejściowych w postaci obrazów na podstawie znanych wzorców identyfikatorów modeli wizyjnych (`gpt-4o`, `claude-3/4`, `gemini`, przyrostki `-vl`/`vision` i podobne). Dodaj `--custom-image-input`, aby wymusić jej włączenie dla nierozpoznanego modelu wizyjnego, albo `--custom-text-input`, aby wymusić obsługę wyłącznie tekstu.

    Wariant trybu odwołania, zapisujący `apiKey` jako `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`:

    ```bash
    export CUSTOM_API_KEY="your-key"
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --secret-input-mode ref \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --custom-image-input \
      --gateway-bind loopback
    ```

  </Accordion>
</AccordionGroup>

Uwierzytelnianie za pomocą tokenu konfiguracyjnego Anthropic jest nadal obsługiwane, ale OpenClaw preferuje ponowne użycie CLI Claude, gdy dostępne jest lokalne logowanie w CLI Claude. W środowisku produkcyjnym preferuj klucz API Anthropic.

## Dodawanie kolejnego agenta

Polecenie `openclaw agents add <name>` tworzy osobnego agenta z własnym obszarem roboczym, sesjami i profilami uwierzytelniania. Uruchomienie go bez opcji `--workspace` (i bez żadnych innych opcji) uruchamia interaktywny kreator; przekazanie dowolnej z opcji `--workspace`, `--model`, `--agent-dir`, `--bind` lub `--non-interactive` uruchamia polecenie nieinteraktywnie, co wymaga podania opcji `--workspace`.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

Zapisywane klucze konfiguracji (wpis `agents.list[]` dla identyfikatora nowego agenta):

- `name`
- `workspace`
- `agentDir`
- `model` (tylko gdy przekazano `--model`)

Uwagi:

- Domyślny obszar roboczy (gdy w interaktywnym kreatorze pominięto `--workspace`): `~/.openclaw/workspace-<agentId>`.
- Opcję `--bind <channel[:accountId]>` można podać wielokrotnie; dodaj powiązania, aby kierować wiadomości przychodzące do nowego agenta (można to również zrobić interaktywnie w kreatorze).
- Nazwa agenta jest normalizowana do prawidłowego identyfikatora agenta; `main` jest zarezerwowane.

## Powiązana dokumentacja

- Centrum wdrażania: [Wdrażanie (CLI)](/pl/start/wizard)
- Pełna dokumentacja: [Dokumentacja konfiguracji CLI](/pl/start/wizard-cli-reference)
- Dokumentacja polecenia: [`openclaw onboard`](/pl/cli/onboard)
