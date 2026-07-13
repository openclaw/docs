---
read_when:
    - Вы автоматизируете первоначальную настройку в скриптах или CI
    - Вам нужны примеры неинтерактивного режима для конкретных провайдеров
sidebarTitle: CLI automation
summary: Сценарная первоначальная настройка и настройка агента для CLI OpenClaw
title: Автоматизация CLI
x-i18n:
    generated_at: "2026-07-13T18:47:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: de3115fd0c675b92f22cf9c44ddd307a854e499c6f163235f991368429b2c152
    source_path: start/wizard-cli-automation.md
    workflow: 16
---

Используйте `openclaw onboard --non-interactive` для автоматизации настройки с помощью скриптов. Для этого требуется `--accept-risk`: неинтерактивная настройка может записывать учетные данные и конфигурацию демона без запроса подтверждения, поэтому этот флаг служит явным подтверждением принятия риска.

<Note>
`--json` не включает неинтерактивный режим. Для скриптов явно передавайте `--non-interactive --accept-risk`.
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

- `--gateway-port` по умолчанию имеет значение `18789`; передавайте его только для переопределения.
- `--skip-bootstrap` пропускает создание файлов рабочего пространства по умолчанию для автоматизации, которая предварительно заполняет собственное рабочее пространство.
- `--secret-input-mode ref` сохраняет в профиле аутентификации ссылку на переменную окружения (`{ source: "env", provider: "default", id: "<ENV_VAR>" }`) вместо ключа в открытом виде. В неинтерактивном режиме `ref` переменная окружения провайдера должна быть уже задана в окружении процесса: передача флага с ключом непосредственно в командной строке без соответствующей переменной окружения приводит к немедленной ошибке.

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref
```

## Примеры для отдельных провайдеров

<AccordionGroup>
  <Accordion title="Пример с API-ключом Anthropic">
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
    Для каталога Go замените значение на `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"`.
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

    `--custom-api-key` необязателен; некоторые конечные точки не требуют аутентификации. Если он не указан, при первоначальной настройке проверяется наличие `CUSTOM_API_KEY` в окружении. `--custom-provider-id` необязателен и, если не указан, автоматически определяется по базовому URL. По умолчанию `--custom-compatibility` имеет значение `openai` (другие значения: `openai-responses`, `anthropic`).

    OpenClaw определяет поддержку изображений на входе по известным шаблонам идентификаторов моделей компьютерного зрения (суффиксы `gpt-4o`, `claude-3/4`, `gemini`, `-vl`/`vision` и аналогичные). Добавьте `--custom-image-input`, чтобы принудительно включить ее для нераспознанной модели компьютерного зрения, или `--custom-text-input`, чтобы принудительно разрешить только текст.

    Вариант с режимом ссылок, сохраняющий `apiKey` как `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`:

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

Аутентификация Anthropic с помощью токена настройки по-прежнему поддерживается, но OpenClaw предпочитает повторно использовать Claude CLI, если доступен локальный вход в Claude CLI. Для рабочей среды предпочтительно использовать API-ключ Anthropic.

## Добавление другого агента

`openclaw agents add <name>` создает отдельного агента с собственным рабочим пространством, сеансами и профилями аутентификации. Запуск без `--workspace` (и без других флагов) открывает интерактивный мастер; передача любого из флагов `--workspace`, `--model`, `--agent-dir`, `--bind` или `--non-interactive` запускает команду неинтерактивно, после чего требуется `--workspace`.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

Записываемые ключи конфигурации (запись `agents.list[]` для идентификатора нового агента):

- `name`
- `workspace`
- `agentDir`
- `model` (только при передаче `--model`)

Примечания:

- Рабочее пространство по умолчанию (если `--workspace` не указан в интерактивном мастере): `~/.openclaw/workspace-<agentId>`.
- `--bind <channel[:accountId]>` можно указывать многократно; добавьте привязки, чтобы направлять входящие сообщения новому агенту (это также можно сделать в интерактивном мастере).
- Имя агента преобразуется в допустимый идентификатор агента; `main` зарезервирован.

## Связанная документация

- Центр первоначальной настройки: [Первоначальная настройка (CLI)](/ru/start/wizard)
- Полный справочник: [Справочник по настройке CLI](/ru/start/wizard-cli-reference)
- Справочник команд: [`openclaw onboard`](/ru/cli/onboard)
