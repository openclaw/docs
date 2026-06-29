---
read_when:
    - Вы хотите включить или настроить code_execution
    - Вам нужен удаленный анализ без доступа к локальной оболочке
    - Вы хотите объединить `x_search` или `web_search` с удаленным анализом Python
summary: 'code_execution: запускать изолированный удаленный анализ на Python с xAI'
title: Выполнение кода
x-i18n:
    generated_at: "2026-06-28T23:50:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d510d0d2b41deab527d456e675a23ef80ac3b55b5f01906ba2c43d90e4452e36
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` запускает изолированный удаленный анализ на Python через Responses API xAI. Он регистрируется встроенным plugin `xai` (по контракту `tools`) и отправляет запросы на тот же endpoint `https://api.x.ai/v1/responses`, который используется `x_search`.

| Свойство          | Значение                                                                          |
| ----------------- | --------------------------------------------------------------------------------- |
| Имя инструмента   | `code_execution`                                                                  |
| Plugin провайдера | `xai` (встроенный, `enabledByDefault: true`)                                      |
| Аутентификация    | профиль аутентификации xAI, `XAI_API_KEY` или `plugins.entries.xai.config.webSearch.apiKey` |
| Модель по умолчанию | `grok-4-1-fast`                                                                 |
| Тайм-аут по умолчанию | 30 секунд                                                                    |
| `maxTurns` по умолчанию | не задано (xAI применяет собственный внутренний лимит)                    |

Это отличается от локального [`exec`](/ru/tools/exec):

- `exec` запускает команды оболочки на вашем компьютере или сопряженном узле.
- `code_execution` запускает Python в удаленной песочнице xAI.

Используйте `code_execution` для:

- Расчетов.
- Табулирования.
- Быстрой статистики.
- Анализа в стиле диаграмм.
- Анализа данных, возвращенных `x_search` или `web_search`.

**Не** используйте его, когда нужны локальные файлы, ваша оболочка, ваш репозиторий или сопряженные устройства. Для этого используйте [`exec`](/ru/tools/exec).

## Настройка

<Steps>
  <Step title="Provide xAI credentials">
    Войдите через Grok OAuth с подходящей подпиской SuperGrok или X Premium
    либо сохраните API-ключ. xAI OAuth использует проверку с кодом устройства,
    поэтому работает с удаленных хостов без callback на localhost. OAuth работает для
    `code_execution` и `x_search`; `XAI_API_KEY` или web-search config plugin
    также могут обеспечивать работу Grok `web_search`.

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    При новой установке те же варианты аутентификации доступны во время
    onboarding:

    ```bash
    openclaw onboard --install-daemon
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    Или используйте API-ключ:

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

    Или через config:

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              webSearch: {
                apiKey: "xai-...",
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Enable and tune code_execution">
    `code_execution` доступен, когда доступны учетные данные xAI. Установите
    `plugins.entries.xai.config.codeExecution.enabled` в `false`, чтобы отключить его,
    или используйте тот же блок для настройки модели и тайм-аута.

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast", // override the default xAI code-execution model
                maxTurns: 2,            // optional cap on internal tool turns
                timeoutSeconds: 30,     // request timeout (default: 30)
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```

    `code_execution` появляется в списке инструментов агента после повторной регистрации plugin xAI с `enabled: true`.

  </Step>
</Steps>

## Как использовать

Задавайте запрос естественно и явно указывайте цель анализа:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

Внутренне инструмент принимает один параметр `task`, поэтому агент должен отправлять полный запрос на анализ и любые встроенные данные в одном prompt.

## Ошибки

Когда инструмент запускается без аутентификации, он возвращает структурированную ошибку `missing_xai_api_key`, указывающую на профиль аутентификации, переменную окружения и параметры config. Ошибка представлена в JSON и не выбрасывается как исключение, поэтому агент может исправиться самостоятельно:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs xAI credentials. Run `openclaw onboard --auth-choice xai-oauth` to sign in with Grok, run `openclaw onboard --auth-choice xai-api-key`, set `XAI_API_KEY` in the Gateway environment, or configure `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Ограничения

- Это удаленное выполнение xAI, а не выполнение локального процесса.
- Рассматривайте результаты как временный анализ, а не как постоянную сессию notebook.
- Не предполагается доступ к локальным файлам или вашему рабочему пространству.
- Для свежих данных X сначала используйте [`x_search`](/ru/tools/web#x_search), а затем передайте результат в `code_execution`.

## Связанное

<CardGroup cols={2}>
  <Card title="Exec tool" href="/ru/tools/exec" icon="terminal">
    Локальное выполнение команд оболочки на вашем компьютере или сопряженном узле.
  </Card>
  <Card title="Exec approvals" href="/ru/tools/exec-approvals" icon="shield">
    Политика разрешения и запрета для выполнения команд оболочки.
  </Card>
  <Card title="Web tools" href="/ru/tools/web" icon="globe">
    `web_search`, `x_search` и `web_fetch`.
  </Card>
  <Card title="xAI provider" href="/ru/providers/xai" icon="microchip">
    Модели Grok, веб-поиск/поиск в X и config выполнения кода.
  </Card>
</CardGroup>
