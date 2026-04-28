---
read_when:
    - Ви автоматизуєте онбординг у скриптах або CI
    - Вам потрібні неінтерактивні приклади для конкретних провайдерів
sidebarTitle: CLI automation
summary: Сценарний онбординг і налаштування агента для OpenClaw CLI
title: Автоматизація CLI
x-i18n:
    generated_at: "2026-04-28T11:26:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a169abafa682e99d2cd89dbcc9a738790d7fdfa7ba204f415baac35d6df4a2f
    source_path: start/wizard-cli-automation.md
    workflow: 16
---

Використовуйте `--non-interactive`, щоб автоматизувати `openclaw onboard`.

<Note>
`--json` не означає неінтерактивний режим. Використовуйте `--non-interactive` (і `--workspace`) для скриптів.
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

Додайте `--json` для машинно-зчитуваного підсумку.

Використовуйте `--skip-bootstrap`, коли ваша автоматизація заздалегідь створює файли робочого простору й не хоче, щоб початкове налаштування створювало стандартні bootstrap-файли.

Використовуйте `--secret-input-mode ref`, щоб зберігати посилання на основі env у профілях автентифікації замість plaintext-значень.
Інтерактивний вибір між посиланнями env і налаштованими посиланнями постачальника (`file` або `exec`) доступний у процесі початкового налаштування.

У неінтерактивному режимі `ref` змінні середовища постачальника мають бути встановлені в середовищі процесу.
Передавання inline-прапорців ключа без відповідної змінної середовища тепер швидко завершується помилкою.

Приклад:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

## Приклади для окремих постачальників

<AccordionGroup>
  <Accordion title="Anthropic API key example">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Gemini example">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Z.AI example">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Vercel AI Gateway example">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Cloudflare AI Gateway example">
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
  <Accordion title="Moonshot example">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Mistral example">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Synthetic example">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="OpenCode example">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
    Перейдіть на `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` для каталогу Go.
  </Accordion>
  <Accordion title="Ollama example">
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
  <Accordion title="Custom provider example">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --custom-api-key "$CUSTOM_API_KEY" \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --custom-image-input \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    `--custom-api-key` є необов’язковим. Якщо його пропущено, початкове налаштування перевіряє `CUSTOM_API_KEY`.
    OpenClaw автоматично позначає поширені ідентифікатори моделей із підтримкою зору як здатні обробляти зображення. Додайте `--custom-image-input` для невідомих користувацьких ідентифікаторів моделей із підтримкою зору або `--custom-text-input`, щоб примусово встановити метадані лише для тексту.

    Варіант режиму посилань:

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
      --custom-image-input \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    У цьому режимі початкове налаштування зберігає `apiKey` як `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.

  </Accordion>
</AccordionGroup>

setup-token Anthropic залишається доступним як підтримуваний шлях токена початкового налаштування, але OpenClaw тепер віддає перевагу повторному використанню Claude CLI, коли воно доступне.
Для production використовуйте ключ API Anthropic.

## Додайте іншого агента

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

Що він задає:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Примітки:

- Стандартні робочі простори відповідають `~/.openclaw/workspace-<agentId>`.
- Додайте `bindings`, щоб спрямовувати вхідні повідомлення (майстер може це зробити).
- Неінтерактивні прапорці: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Пов’язана документація

- Центр початкового налаштування: [Початкове налаштування (CLI)](/uk/start/wizard)
- Повний довідник: [Довідник із налаштування CLI](/uk/start/wizard-cli-reference)
- Довідник команд: [`openclaw onboard`](/uk/cli/onboard)
