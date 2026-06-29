---
read_when:
    - Вы хотите использовать Chutes с OpenClaw
    - Вам нужен путь настройки OAuth или ключа API
    - Вам нужны модель по умолчанию, псевдонимы или поведение обнаружения
summary: Настройка Chutes (OAuth или API-ключ, обнаружение моделей, псевдонимы)
title: Chutes
x-i18n:
    generated_at: "2026-06-28T23:35:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f1898c568fd664303a8bb5c2e46228c75f9c217bec5a65e752d9c7e10b980bb
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) предоставляет каталоги open-source моделей через
API, совместимый с OpenAI. OpenClaw поддерживает как браузерный OAuth, так и
аутентификацию напрямую по API-ключу для провайдера `chutes`.

| Свойство | Значение                     |
| -------- | ---------------------------- |
| Провайдер | `chutes`                    |
| API      | совместимый с OpenAI         |
| Базовый URL | `https://llm.chutes.ai/v1` |
| Аутентификация | OAuth или API-ключ (см. ниже) |

## Установка Plugin

Установите официальный Plugin, затем перезапустите Gateway:

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## Начало работы

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Run the OAuth onboarding flow">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw запускает браузерный поток локально или показывает поток с URL +
        вставкой redirect на удаленных/headless хостах. OAuth-токены автоматически
        обновляются через профили аутентификации OpenClaw.
      </Step>
      <Step title="Verify the default model">
        После онбординга модель по умолчанию задается как
        `chutes/zai-org/GLM-4.7-TEE`, а статический каталог Chutes
        регистрируется.
      </Step>
    </Steps>
  </Tab>
  <Tab title="API key">
    <Steps>
      <Step title="Get an API key">
        Создайте ключ на
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).
      </Step>
      <Step title="Run the API key onboarding flow">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
      <Step title="Verify the default model">
        После онбординга модель по умолчанию задается как
        `chutes/zai-org/GLM-4.7-TEE`, а статический каталог Chutes
        регистрируется.
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
Оба пути аутентификации регистрируют статический каталог Chutes и задают модель
по умолчанию как `chutes/zai-org/GLM-4.7-TEE`. Переменные окружения времени
выполнения: `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`.
</Note>

## Поведение обнаружения

Когда аутентификация Chutes доступна, OpenClaw запрашивает каталог Chutes с этими
учетными данными и использует обнаруженные модели. Если обнаружение завершается
сбоем, OpenClaw возвращается к статическому каталогу, чтобы онбординг и запуск
по-прежнему работали.

## Псевдонимы по умолчанию

OpenClaw регистрирует три удобных псевдонима для статического каталога Chutes:

| Псевдоним       | Целевая модель                                      |
| --------------- | --------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                        |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`              |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## Встроенный стартовый каталог

Статический резервный каталог включает текущие ссылки Chutes:

| Ссылка модели                                         |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                          |
| `chutes/zai-org/GLM-5-TEE`                            |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`             |
| `chutes/moonshotai/Kimi-K2.5-TEE`                     |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                    |
| `chutes/openai/gpt-oss-120b-TEE`                      |

## Пример конфигурации

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-4.7-TEE" },
      models: {
        "chutes/zai-org/GLM-4.7-TEE": { alias: "Chutes GLM 4.7" },
        "chutes/deepseek-ai/DeepSeek-V3.2-TEE": { alias: "Chutes DeepSeek V3.2" },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="OAuth overrides">
    Вы можете настроить поток OAuth с помощью необязательных переменных окружения:

    | Переменная | Назначение |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | Пользовательский ID OAuth-клиента |
    | `CHUTES_CLIENT_SECRET` | Пользовательский секрет OAuth-клиента |
    | `CHUTES_OAUTH_REDIRECT_URI` | Пользовательский URI перенаправления |
    | `CHUTES_OAUTH_SCOPES` | Пользовательские области OAuth |

    См. [документацию Chutes OAuth](https://chutes.ai/docs/sign-in-with-chutes/overview)
    для требований к приложению перенаправления и справки.

  </Accordion>

  <Accordion title="Notes">
    - Обнаружение по API-ключу и OAuth использует один и тот же id провайдера `chutes`.
    - Модели Chutes регистрируются как `chutes/<model-id>`.
    - Если обнаружение при запуске завершается сбоем, статический каталог используется автоматически.

  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Model selection" href="/ru/concepts/model-providers" icon="layers">
    Правила провайдеров, ссылки моделей и поведение failover.
  </Card>
  <Card title="Configuration reference" href="/ru/gateway/configuration-reference" icon="gear">
    Полная схема конфигурации, включая настройки провайдера.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Панель управления Chutes и документация API.
  </Card>
  <Card title="Chutes API keys" href="https://chutes.ai/settings/api-keys" icon="key">
    Создавайте API-ключи Chutes и управляйте ими.
  </Card>
</CardGroup>
