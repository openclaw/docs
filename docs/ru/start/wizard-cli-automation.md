---
read_when:
    - Вы автоматизируете онбординг в скриптах или CI
    - Вам нужны неинтерактивные примеры для конкретных провайдеров
sidebarTitle: CLI automation
summary: Сценарное первичное подключение и настройка агента для OpenClaw CLI
title: Автоматизация CLI
x-i18n:
    generated_at: "2026-06-28T23:48:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a169abafa682e99d2cd89dbcc9a738790d7fdfa7ba204f415baac35d6df4a2f
    source_path: start/wizard-cli-automation.md
    workflow: 16
---

Используйте `--non-interactive`, чтобы автоматизировать `openclaw onboard`.

<Note>
`--json` не включает неинтерактивный режим. Используйте `--non-interactive` (и `--workspace`) для скриптов.
</Note>

## Базовый неинтерактивный пример

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

Добавьте `--json` для машиночитаемой сводки.

Используйте `--skip-bootstrap`, когда ваша автоматизация заранее создает файлы workspace и не должна позволять onboarding создавать стандартные bootstrap-файлы.

Используйте `--secret-input-mode ref`, чтобы хранить ссылки на env-backed значения в auth-профилях вместо plaintext-значений.
Интерактивный выбор между env refs и настроенными provider refs (`file` или `exec`) доступен в процессе onboarding.

В неинтерактивном режиме `ref` переменные окружения провайдера должны быть заданы в окружении процесса.
Передача inline key flags без соответствующей переменной окружения теперь быстро завершается ошибкой.

Пример:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

## Примеры для отдельных провайдеров

<AccordionGroup>
  <Accordion title="Пример с Anthropic API key">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Пример Gemini">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Пример Z.AI">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Пример Vercel AI Gateway">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Пример Cloudflare AI Gateway">
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
  <Accordion title="Пример Moonshot">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Пример Mistral">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Пример Synthetic">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Пример OpenCode">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
    Переключитесь на `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` для каталога Go.
  </Accordion>
  <Accordion title="Пример Ollama">
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
  <Accordion title="Пример пользовательского провайдера">
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

    `--custom-api-key` необязателен. Если он опущен, onboarding проверяет `CUSTOM_API_KEY`.
    OpenClaw автоматически помечает распространенные ID vision-моделей как поддерживающие изображения. Добавьте `--custom-image-input` для неизвестных пользовательских vision ID или `--custom-text-input`, чтобы принудительно задать метаданные только для текста.

    Вариант режима ref:

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

    В этом режиме onboarding сохраняет `apiKey` как `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.

  </Accordion>
</AccordionGroup>

setup-token Anthropic остается доступным как поддерживаемый путь токена onboarding, но теперь OpenClaw предпочитает повторное использование Claude CLI, когда оно доступно.
Для production предпочитайте Anthropic API key.

## Добавьте еще одного агента

Используйте `openclaw agents add <name>`, чтобы создать отдельного агента с собственным workspace,
сеансами и auth-профилями. Запуск без `--workspace` открывает мастер.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

Что это задает:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Примечания:

- Workspaces по умолчанию следуют шаблону `~/.openclaw/workspace-<agentId>`.
- Добавьте `bindings`, чтобы направлять входящие сообщения (мастер может это сделать).
- Неинтерактивные флаги: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Связанные документы

- Центр onboarding: [Onboarding (CLI)](/ru/start/wizard)
- Полный справочник: [Справочник по настройке CLI](/ru/start/wizard-cli-reference)
- Справочник команд: [`openclaw onboard`](/ru/cli/onboard)
