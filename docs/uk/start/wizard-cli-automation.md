---
read_when:
    - Ви автоматизуєте початкове налаштування у скриптах або CI
    - Вам потрібні приклади неінтерактивного режиму для конкретних провайдерів
sidebarTitle: CLI automation
summary: Сценарне початкове налаштування та налаштування агента для CLI OpenClaw
title: Автоматизація CLI
x-i18n:
    generated_at: "2026-07-12T13:43:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de3115fd0c675b92f22cf9c44ddd307a854e499c6f163235f991368429b2c152
    source_path: start/wizard-cli-automation.md
    workflow: 16
---

Використовуйте `openclaw onboard --non-interactive` для автоматизації налаштування за допомогою скриптів. Для цієї команди потрібен прапорець `--accept-risk`: неінтерактивне налаштування може записувати облікові дані та конфігурацію демона без запиту на підтвердження, тому цей прапорець є явним підтвердженням прийняття ризику.

<Note>
`--json` не вмикає неінтерактивний режим. Для скриптів явно передавайте `--non-interactive --accept-risk`.
</Note>

## Базовий приклад неінтерактивного налаштування

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

Додайте `--json`, щоб отримати зведення у форматі, придатному для машинного читання.

- Типове значення `--gateway-port` — `18789`; передавайте цей прапорець лише для перевизначення.
- `--skip-bootstrap` пропускає створення типових файлів робочого простору для автоматизації, яка попередньо заповнює власний робочий простір.
- `--secret-input-mode ref` зберігає в профілі автентифікації посилання на змінну середовища (`{ source: "env", provider: "default", id: "<ENV_VAR>" }`) замість ключа у вигляді відкритого тексту. У неінтерактивному режимі `ref` змінну середовища постачальника вже має бути задано в середовищі процесу: передавання прапорця з ключем без відповідної змінної середовища негайно завершується помилкою.

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref
```

## Приклади для окремих постачальників

<AccordionGroup>
  <Accordion title="Приклад із ключем API Anthropic">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Приклад із Cloudflare AI Gateway">
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
  <Accordion title="Приклад із Gemini">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Приклад із Mistral">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Приклад із Moonshot">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Приклад із Ollama">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ollama \
      --custom-model-id "qwen3.5:27b" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Приклад із OpenCode">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-bind loopback
    ```
    Для каталогу Go замініть на `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"`.
  </Accordion>
  <Accordion title="Приклад із Synthetic">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Приклад із Vercel AI Gateway">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Приклад із Z.AI">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Приклад із власним постачальником">
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

    `--custom-api-key` є необов’язковим: деякі кінцеві точки не потребують автентифікації. Якщо його не вказано, під час початкового налаштування перевіряється наявність `CUSTOM_API_KEY` у середовищі. `--custom-provider-id` є необов’язковим і, якщо його не вказано, автоматично визначається з базової URL-адреси. Типове значення `--custom-compatibility` — `openai` (інші значення: `openai-responses`, `anthropic`).

    OpenClaw визначає підтримку зображень як вхідних даних за відомими шаблонами ідентифікаторів моделей із підтримкою зору (`gpt-4o`, `claude-3/4`, `gemini`, суфікси `-vl`/`vision` тощо). Додайте `--custom-image-input`, щоб примусово ввімкнути її для нерозпізнаної моделі з підтримкою зору, або `--custom-text-input`, щоб примусово дозволити лише текст.

    Варіант режиму `ref`, який зберігає `apiKey` як `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`:

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

Автентифікація за допомогою токена налаштування Anthropic залишається підтримуваною, але OpenClaw надає перевагу повторному використанню Claude CLI, коли доступний локальний вхід у Claude CLI. Для робочого середовища віддавайте перевагу ключу API Anthropic.

## Додавання іншого агента

`openclaw agents add <name>` створює окремого агента з власним робочим простором, сеансами та профілями автентифікації. Запуск без `--workspace` (та без інших прапорців) відкриває інтерактивний майстер; передавання будь-якого з прапорців `--workspace`, `--model`, `--agent-dir`, `--bind` або `--non-interactive` запускає команду неінтерактивно, після чого `--workspace` стає обов’язковим.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

Ключі конфігурації, які записує команда (запис `agents.list[]` для ідентифікатора нового агента):

- `name`
- `workspace`
- `agentDir`
- `model` (лише коли передано `--model`)

Примітки:

- Типовий робочий простір (якщо в інтерактивному майстрі не вказано `--workspace`): `~/.openclaw/workspace-<agentId>`.
- `--bind <channel[:accountId]>` можна передавати кілька разів; додайте прив’язки, щоб спрямовувати вхідні повідомлення новому агенту (це також можна зробити інтерактивно в майстрі).
- Ім’я агента нормалізується до коректного ідентифікатора агента; `main` зарезервовано.

## Пов’язана документація

- Центр початкового налаштування: [Початкове налаштування (CLI)](/uk/start/wizard)
- Повний довідник: [Довідник із налаштування CLI](/uk/start/wizard-cli-reference)
- Довідник команди: [`openclaw onboard`](/uk/cli/onboard)
