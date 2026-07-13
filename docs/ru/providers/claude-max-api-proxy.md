---
read_when:
    - Вы хотите использовать подписку Claude Max с инструментами, совместимыми с OpenAI
    - Вам нужен локальный API-сервер, оборачивающий Claude Code CLI
    - Вы хотите сравнить доступ к Anthropic по подписке и по API-ключу
summary: Прокси от сообщества для предоставления учётных данных подписки Claude через конечную точку, совместимую с OpenAI
title: Прокси API Claude Max
x-i18n:
    generated_at: "2026-07-13T20:11:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 5d0d9a70e14d7d444e57e9bcf169816fec4013a2680dfc9b1761e6ab32109e9f
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** — это пакет npm, созданный сообществом (не плагин OpenClaw), который
предоставляет подписку Claude Max/Pro в виде API-эндпоинта, совместимого с OpenAI, чтобы
вместо ключа API Anthropic можно было подключить к подписке любой
инструмент, совместимый с OpenAI.

<Warning>
Обеспечивается только техническая совместимость; этот способ не одобрен официально. В прошлом Anthropic
блокировала некоторые варианты использования подписки вне Claude Code; прежде чем полагаться
на этот способ, проверьте актуальные правила оплаты Anthropic.

В документации Anthropic по Claude Code `claude -p` описывается как использование Agent SDK и программный
доступ. Согласно обновлению службы поддержки Anthropic от 15 июня 2026 года, использование Claude Agent SDK,
`claude -p` и сторонних приложений учитывается в лимитах
подписки, в которую выполнен вход (ранее объявленный отдельный план кредитов Agent SDK
приостановлен). См. [статью о плане Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan),
статьи о планах [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
и [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan),
а также раздел [Провайдер Anthropic](/ru/providers/anthropic) с примечаниями OpenClaw
об оплате собственного Claude CLI.
</Warning>

## Зачем это использовать

| Подход                    | Способ оплаты                                    | Лучше всего подходит для                    |
| ------------------------- | ----------------------------------------------- | ------------------------------------------ |
| Ключ API Anthropic        | Оплата за каждый токен через Claude Console     | Рабочих приложений, общей автоматизации и больших объёмов |
| Прокси подписки Claude    | Правила плана и кредитов Claude Code / `claude -p` | Личных экспериментов с совместимыми инструментами |

Этот прокси позволяет использовать подписку Claude Max или Pro с инструментами,
совместимыми с OpenAI. Это не безлимитный вариант с фиксированной оплатой — он наследует лимиты
использования Claude Code. Для рабочего использования ключи API остаются более прозрачным
способом оплаты.

## Как это работает

```text
Ваше приложение -> claude-max-api-proxy -> Claude Code CLI / claude -p -> Anthropic
     (формат OpenAI)                       (преобразует формат)          (использует ваш вход)
```

Для каждого запроса прокси запускает Claude Code CLI как подпроцесс, преобразует
запросы чата в формате OpenAI в запросы CLI и передаёт потоковый ответ (или возвращает его)
обратно в формате OpenAI.

## Начало работы

<Steps>
  <Step title="Установите прокси">
    Требуются Node.js 20+ и Claude Code CLI с выполненным входом.

    ```bash
    npm install -g claude-max-api-proxy

    # Проверьте, что в Claude CLI выполнен вход
    claude --version
    claude auth login   # если вход ещё не выполнен
    ```

  </Step>
  <Step title="Запустите сервер">
    ```bash
    claude-max-api
    # Сервер работает по адресу http://localhost:3456
    ```
  </Step>
  <Step title="Протестируйте прокси">
    ```bash
    curl http://localhost:3456/health
    curl http://localhost:3456/v1/models

    curl http://localhost:3456/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{
        "model": "claude-opus-4",
        "messages": [{"role": "user", "content": "Привет!"}]
      }'
    ```

  </Step>
  <Step title="Настройте OpenClaw">
    Укажите прокси в OpenClaw как пользовательский эндпоинт, совместимый с OpenAI:

    ```json5
    {
      env: {
        OPENAI_API_KEY: "not-needed",
        OPENAI_BASE_URL: "http://localhost:3456/v1",
      },
      agents: {
        defaults: {
          model: { primary: "openai/claude-opus-4" },
        },
      },
    }
    ```

  </Step>
</Steps>

<Note>
Приведённые ниже идентификаторы моделей относятся к собственному каталогу прокси, а не к ссылкам OpenClaw
на модели Anthropic. Каждый идентификатор сопоставляется с псевдонимом модели Claude Code CLI (`opus`, `sonnet`,
`haiku`), поэтому базовая модель меняется всякий раз, когда Anthropic обновляет соответствующий
псевдоним в CLI. Прежде чем полагаться на конкретное сопоставление,
проверьте актуальный README прокси.
</Note>

| Идентификатор модели | Псевдоним CLI | Текущее сопоставление |
| ----------------- | --------- | --------------- |
| `claude-opus-4`   | `opus`    | Claude Opus 4.5 |
| `claude-sonnet-4` | `sonnet`  | Claude Sonnet 4 |
| `claude-haiku-4`  | `haiku`   | Claude Haiku 4  |

## Расширенная настройка

<AccordionGroup>
  <Accordion title="Примечания о совместимости с OpenAI через прокси">
    Здесь используется универсальный пользовательский маршрут OpenClaw `/v1`, совместимый с OpenAI, — тот же
    путь, что и для любого другого самостоятельно размещённого бэкенда, совместимого с OpenAI:

    - Формирование запросов, предназначенное только для нативного OpenAI, не применяется.
    - `/fast` и `service_tier` применяются только к прямому трафику `api.anthropic.com`;
      маршруты через прокси оставляют `service_tier` без изменений (см.
      [быстрый режим провайдера Anthropic](/ru/providers/anthropic#advanced-configuration)).
    - Формирование полезной нагрузки для Responses `store`, подсказок кэша промптов и
      совместимости рассуждений OpenAI не выполняется.
    - Заголовки атрибуции OpenAI/Codex от OpenClaw (`originator`, `version`,
      `User-Agent`) отправляются только при нативном трафике OAuth `api.openai.com`, но не
      пользовательским целям `OPENAI_BASE_URL`, таким как этот прокси.

  </Accordion>

  <Accordion title="Автозапуск в macOS с помощью LaunchAgent">
    ```bash
    cat > ~/Library/LaunchAgents/com.claude-max-api.plist << 'EOF'
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
    <dict>
      <key>Label</key>
      <string>com.claude-max-api</string>
      <key>RunAtLoad</key>
      <true/>
      <key>KeepAlive</key>
      <true/>
      <key>ProgramArguments</key>
      <array>
        <string>/usr/local/bin/node</string>
        <string>/usr/local/lib/node_modules/claude-max-api-proxy/dist/server/standalone.js</string>
      </array>
      <key>EnvironmentVariables</key>
      <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/opt/homebrew/bin:~/.local/bin:/usr/bin:/bin</string>
      </dict>
    </dict>
    </plist>
    EOF

    launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.claude-max-api.plist
    ```

  </Accordion>
</AccordionGroup>

## Примечания

- Наследует поведение Claude Code `claude -p` в отношении оплаты, кредитов использования и ограничения частоты запросов.
- Привязывается только к `127.0.0.1`; не отправляет данные сторонним серверам, кроме собственного вызова CLI к Anthropic.
- Поддерживаются потоковые ответы.
- Ошибки аутентификации не проверяются при запуске и проявляются только после фактического выполнения запроса чата; если в CLI не выполнен вход, первый запрос завершится ошибкой, а сервер всё равно запустится.

<Note>
О нативной интеграции Anthropic с Claude CLI или ключами API см. в разделе [Провайдер Anthropic](/ru/providers/anthropic). О подписках OpenAI/Codex см. в разделе [Провайдер OpenAI](/ru/providers/openai).
</Note>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Провайдер Anthropic" href="/ru/providers/anthropic" icon="bolt">
    Нативная интеграция OpenClaw с Claude CLI или ключами API.
  </Card>
  <Card title="Провайдер OpenAI" href="/ru/providers/openai" icon="robot">
    Для подписок OpenAI/Codex.
  </Card>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Обзор всех провайдеров, ссылок на модели и поведения при переключении после сбоя.
  </Card>
  <Card title="Конфигурация" href="/ru/gateway/configuration" icon="gear">
    Полный справочник по конфигурации.
  </Card>
</CardGroup>
