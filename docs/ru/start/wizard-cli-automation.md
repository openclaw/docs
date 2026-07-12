---
read_when:
    - Вы автоматизируете первоначальную настройку в скриптах или CI
    - Вам нужны примеры неинтерактивной настройки для конкретных провайдеров
sidebarTitle: CLI automation
summary: Сценарная первоначальная настройка OpenClaw CLI и настройка агента
title: Автоматизация CLI
x-i18n:
    generated_at: "2026-07-12T11:52:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de3115fd0c675b92f22cf9c44ddd307a854e499c6f163235f991368429b2c152
    source_path: start/wizard-cli-automation.md
    workflow: 16
---

Используйте `openclaw onboard --non-interactive` для автоматизации настройки. Для этой команды требуется флаг `--accept-risk`: неинтерактивная настройка может записывать учётные данные и конфигурацию демона без запроса подтверждения, поэтому этот флаг служит явным подтверждением принятия риска.

<Note>
`--json` не включает неинтерактивный режим. В скриптах явно передавайте `--non-interactive --accept-risk`.
</Note>

## Базовый пример неинтерактивной настройки

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

Добавьте `--json`, чтобы получить сводку в машиночитаемом формате.

- По умолчанию `--gateway-port` имеет значение `18789`; передавайте этот флаг только для переопределения.
- `--skip-bootstrap` отключает создание стандартных файлов рабочего пространства для автоматизации, которая заранее подготавливает собственное рабочее пространство.
- `--secret-input-mode ref` сохраняет в профиле аутентификации ссылку на переменную среды (`{ source: "env", provider: "default", id: "<ENV_VAR>" }`) вместо ключа в открытом виде. В неинтерактивном режиме `ref` переменная среды провайдера уже должна быть задана в окружении процесса: передача флага с ключом непосредственно в командной строке без соответствующей переменной среды приводит к немедленной ошибке.

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref
```

## Примеры для отдельных провайдеров

<AccordionGroup>
  <Accordion title="Пример с ключом API Anthropic">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Пример с Cloudflare AI Gateway">
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
  <Accordion title="Пример с Gemini">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Пример с Mistral">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Пример с Moonshot">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Пример с Ollama">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ollama \
      --custom-model-id "qwen3.5:27b" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Пример с OpenCode">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-bind loopback
    ```
    Для каталога Go замените параметры на `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"`.
  </Accordion>
  <Accordion title="Пример с Synthetic">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Пример с Vercel AI Gateway">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Пример с Z.AI">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Пример с пользовательским провайдером">
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

    Параметр `--custom-api-key` необязателен: некоторые конечные точки не требуют аутентификации. Если он не указан, процесс первоначальной настройки проверяет переменную среды `CUSTOM_API_KEY`. Параметр `--custom-provider-id` также необязателен; если он не указан, идентификатор автоматически формируется из базового URL. По умолчанию `--custom-compatibility` имеет значение `openai` (другие значения: `openai-responses`, `anthropic`).

    OpenClaw определяет поддержку изображений во входных данных по известным шаблонам идентификаторов моделей с компьютерным зрением (`gpt-4o`, `claude-3/4`, `gemini`, суффиксы `-vl`/`vision` и аналогичные). Добавьте `--custom-image-input`, чтобы принудительно включить её для нераспознанной модели с компьютерным зрением, или `--custom-text-input`, чтобы разрешить только текстовые входные данные.

    Вариант с режимом ссылок, сохраняющий `apiKey` в виде `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`:

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

Аутентификация Anthropic с помощью токена настройки по-прежнему поддерживается, но OpenClaw предпочитает повторно использовать Claude CLI, если в локальном Claude CLI выполнен вход. Для рабочей среды рекомендуется использовать ключ API Anthropic.

## Добавление ещё одного агента

`openclaw agents add <name>` создаёт отдельного агента с собственными рабочим пространством, сеансами и профилями аутентификации. Запуск без `--workspace` и других флагов открывает интерактивный мастер; передача любого из флагов `--workspace`, `--model`, `--agent-dir`, `--bind` или `--non-interactive` запускает команду неинтерактивно, после чего параметр `--workspace` становится обязательным.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

Записываемые ключи конфигурации — запись `agents.list[]` для идентификатора нового агента:

- `name`
- `workspace`
- `agentDir`
- `model` (только при передаче `--model`)

Примечания:

- Рабочее пространство по умолчанию, если `--workspace` не указан в интерактивном мастере: `~/.openclaw/workspace-<agentId>`.
- Флаг `--bind <channel[:accountId]>` можно указывать несколько раз; добавляйте привязки, чтобы направлять входящие сообщения новому агенту. Это также можно сделать интерактивно в мастере.
- Имя агента преобразуется в допустимый идентификатор агента; `main` зарезервирован.

## Связанная документация

- Раздел о первоначальной настройке: [Первоначальная настройка (CLI)](/ru/start/wizard)
- Полное справочное руководство: [Справочник по настройке через CLI](/ru/start/wizard-cli-reference)
- Справочник команд: [`openclaw onboard`](/ru/cli/onboard)
