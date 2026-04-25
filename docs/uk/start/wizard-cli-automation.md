---
read_when:
    - Ви автоматизуєте онбординг у скриптах або CI
    - Вам потрібні неінтерактивні приклади для конкретних provider-ів
sidebarTitle: CLI automation
summary: Скриптовий онбординг і налаштування агента для CLI OpenClaw
title: Автоматизація CLI
x-i18n:
    generated_at: "2026-04-25T17:34:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 50b6ef35554ec085012a84b8abb8d52013934ada5293d941babea56eaacf4a9f
    source_path: start/wizard-cli-automation.md
    workflow: 15
---

Використовуйте `--non-interactive`, щоб автоматизувати `openclaw onboard`.

<Note>
`--json` не означає неінтерактивний режим. Для скриптів використовуйте `--non-interactive` (і `--workspace`).
</Note>

## Базовий неінтерактивний приклад

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
  --skip-bootstrap \
  --skip-skills
```

Додайте `--json` для машинозчитуваного підсумку.

Використовуйте `--skip-bootstrap`, коли ваша автоматизація попередньо заповнює файли workspace і не хоче, щоб онбординг створював стандартні bootstrap-файли.

Використовуйте `--secret-input-mode ref`, щоб зберігати refs, підкріплені env, в auth-профілях замість значень у відкритому вигляді.
Інтерактивний вибір між env refs і налаштованими refs provider-а (`file` або `exec`) доступний у процесі онбордингу.

У неінтерактивному режимі `ref` змінні env provider-а мають бути встановлені в середовищі процесу.
Передавання inline-прапорців ключів без відповідної змінної env тепер одразу завершується помилкою.

Приклад:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

## Приклади для конкретних provider-ів

<AccordionGroup>
  <Accordion title="Приклад API-ключа Anthropic">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Приклад Gemini">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Приклад Z.AI">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Приклад Vercel AI Gateway">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Приклад Cloudflare AI Gateway">
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
  <Accordion title="Приклад Moonshot">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Приклад Mistral">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Приклад Synthetic">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Приклад OpenCode">
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
  <Accordion title="Приклад Ollama">
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
  <Accordion title="Приклад власного provider-а">
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

    `--custom-api-key` є необов’язковим. Якщо його пропущено, онбординг перевіряє `CUSTOM_API_KEY`.

    Варіант для режиму ref:

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

    У цьому режимі онбординг зберігає `apiKey` як `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.

  </Accordion>
</AccordionGroup>

Anthropic setup-token усе ще доступний як підтримуваний шлях токена онбордингу, але OpenClaw тепер надає перевагу повторному використанню Claude CLI, коли це можливо.
Для production віддавайте перевагу API-ключу Anthropic.

## Додайте ще одного агента

Використовуйте `openclaw agents add <name>`, щоб створити окремого агента з власними workspace,
sessions і auth-профілями. Запуск без `--workspace` відкриває майстер.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

Що це налаштовує:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Примітки:

- Workspace за замовчуванням мають формат `~/.openclaw/workspace-<agentId>`.
- Додайте `bindings`, щоб маршрутизувати вхідні повідомлення (майстер може це зробити).
- Неінтерактивні прапорці: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Пов’язані документи

- Центр онбордингу: [Онбординг (CLI)](/uk/start/wizard)
- Повний довідник: [Довідник із налаштування CLI](/uk/start/wizard-cli-reference)
- Довідник команд: [`openclaw onboard`](/uk/cli/onboard)
