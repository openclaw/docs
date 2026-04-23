---
read_when:
    - Ви автоматизуєте onboarding у скриптах або CI
    - Вам потрібні non-interactive приклади для конкретних провайдерів
sidebarTitle: CLI automation
summary: Скриптовий onboarding і налаштування агента для CLI OpenClaw
title: Автоматизація CLI
x-i18n:
    generated_at: "2026-04-23T21:12:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: e65db62f68542e017f1e4bb9b802fee49ec50fe196cda6a90d0d2122fca9b44d
    source_path: start/wizard-cli-automation.md
    workflow: 15
---

Використовуйте `--non-interactive`, щоб автоматизувати `openclaw onboard`.

<Note>
`--json` сам по собі не вмикає non-interactive режим. Для скриптів використовуйте `--non-interactive` (і `--workspace`).
</Note>

## Базовий non-interactive приклад

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

Додайте `--json`, щоб отримати машиночитний підсумок.

Використовуйте `--secret-input-mode ref`, щоб зберігати в профілях автентифікації посилання на env-backed значення замість відкритих текстових значень.
Інтерактивний вибір між env refs і налаштованими provider refs (`file` або `exec`) доступний у потоці onboarding.

У non-interactive режимі `ref` env vars провайдера мають бути встановлені в середовищі процесу.
Передавання inline-прапорців ключів без відповідної env var тепер одразу завершується помилкою.

Приклад:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

## Приклади для конкретних провайдерів

<AccordionGroup>
  <Accordion title="Приклад для Anthropic API key">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Приклад для Gemini">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Приклад для Z.AI">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Приклад для Vercel AI Gateway">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Приклад для Cloudflare AI Gateway">
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
  <Accordion title="Приклад для Moonshot">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Приклад для Mistral">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Приклад для Synthetic">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Приклад для OpenCode">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
    Замініть на `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` для каталогу Go.
  </Accordion>
  <Accordion title="Приклад для Ollama">
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
  <Accordion title="Приклад для власного провайдера">
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

    `--custom-api-key` необов’язковий. Якщо його пропустити, onboarding перевіряє `CUSTOM_API_KEY`.

    Варіант у режимі ref:

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

    У цьому режимі onboarding зберігає `apiKey` як `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.

  </Accordion>
</AccordionGroup>

Anthropic setup-token усе ще доступний як підтримуваний токеновий шлях onboarding, але тепер OpenClaw віддає перевагу повторному використанню Claude CLI, коли це можливо.
Для production надавайте перевагу Anthropic API key.

## Додати ще одного агента

Використовуйте `openclaw agents add <name>`, щоб створити окремого агента з власним робочим простором,
сесіями та профілями автентифікації. Запуск без `--workspace` відкриває майстер.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

Що це встановлює:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Примітки:

- Типові робочі простори мають формат `~/.openclaw/workspace-<agentId>`.
- Додайте `bindings`, щоб маршрутизувати вхідні повідомлення (майстер може це зробити).
- Non-interactive прапорці: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Пов’язана документація

- Центр onboarding: [Onboarding (CLI)](/uk/start/wizard)
- Повний довідник: [Довідник CLI Setup](/uk/start/wizard-cli-reference)
- Довідник команди: [`openclaw onboard`](/uk/cli/onboard)
