---
read_when:
    - Вы хотите использовать Chutes с OpenClaw
    - Вам нужен способ настройки OAuth или API-ключа
    - Вам нужна модель по умолчанию, псевдонимы или поведение обнаружения
summary: Настройка Chutes (OAuth или ключ API, обнаружение моделей, псевдонимы)
title: Chutes
x-i18n:
    generated_at: "2026-07-13T18:40:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: dafa96c4a56b9d38d033b87cc077d359cb71adaf1ca41a0ab6b6cc77b66484a7
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) предоставляет каталоги моделей с открытым исходным кодом через
API, совместимый с OpenAI. OpenClaw поддерживает как OAuth через браузер, так и аутентификацию по ключу API.

| Свойство         | Значение                                                   |
| ---------------- | ------------------------------------------------------- |
| Провайдер         | `chutes`                                                |
| Плагин           | официальный внешний пакет (`@openclaw/chutes-provider`) |
| API              | совместимый с OpenAI                                       |
| Базовый URL         | `https://llm.chutes.ai/v1`                              |
| Аутентификация             | OAuth или ключ API (см. ниже)                            |
| Переменные среды выполнения | `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`                  |

`CHUTES_OAUTH_TOKEN` позволяет напрямую передать уже полученный токен доступа OAuth
(например, в CI), минуя описанный ниже интерактивный процесс в браузере.

## Установка плагина

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## Начало работы

Оба способа устанавливают модель по умолчанию `chutes/zai-org/GLM-4.7-TEE` и регистрируют
каталог Chutes.

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Запустите процесс первоначальной настройки OAuth">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw запускает процесс в браузере локально, а на удалённых серверах и серверах без графического интерфейса
        показывает URL и предлагает вставить адрес перенаправления. Токены OAuth автоматически обновляются через профили
        аутентификации OpenClaw.
      </Step>
    </Steps>
  </Tab>
  <Tab title="Ключ API">
    <Steps>
      <Step title="Получите ключ API">
        Создайте ключ на странице
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).
      </Step>
      <Step title="Запустите процесс первоначальной настройки ключа API">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Поведение при обнаружении

Когда доступна аутентификация Chutes, OpenClaw отправляет запрос к `GET /v1/models` с этими
учётными данными и использует обнаруженные модели, кэшируя результат на 5 минут для каждых
учётных данных. Если срок действия ключа истёк или он не авторизован (HTTP 401), OpenClaw повторяет запрос один раз
без учётных данных. Если после этого обнаружение по-прежнему не возвращает строк, завершается с ошибкой или возвращает любой
другой статус, отличный от 2xx, используется встроенный статический каталог (обнаружение как по ключу API,
так и через OAuth выполняется по одному и тому же пути). Если обнаружение завершается с ошибкой при запуске,
статический каталог используется автоматически.

## Псевдонимы по умолчанию

OpenClaw регистрирует три удобных псевдонима для каталога Chutes:

| Псевдоним           | Целевая модель                                          |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## Встроенный начальный каталог

Встроенный резервный каталог содержит 47 моделей. Ниже приведена репрезентативная выборка текущих ссылок:

| Ссылка на модель                                             |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                          |
| `chutes/zai-org/GLM-5-TEE`                            |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`             |
| `chutes/moonshotai/Kimi-K2.5-TEE`                     |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                    |
| `chutes/openai/gpt-oss-120b-TEE`                      |

Чтобы получить полный список, выполните `openclaw models list --all --provider chutes`.

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
  <Accordion title="Переопределения OAuth">
    Настройте процесс OAuth с помощью необязательных переменных среды:

    | Переменная | Назначение |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | Идентификатор клиента OAuth (запрашивается, если не задан) |
    | `CHUTES_CLIENT_SECRET` | Секрет клиента OAuth |
    | `CHUTES_OAUTH_REDIRECT_URI` | URI перенаправления (по умолчанию `http://127.0.0.1:1456/oauth-callback`) |
    | `CHUTES_OAUTH_SCOPES` | Области доступа, разделённые пробелами (по умолчанию `openid profile chutes:invoke`) |

    Требования к приложению перенаправления и справку см. в
    [документации Chutes по OAuth](https://chutes.ai/docs/sign-in-with-chutes/overview).

  </Accordion>

  <Accordion title="Примечания">
    - Модели Chutes регистрируются как `chutes/<model-id>`.
    - Chutes не сообщает об использовании токенов во время потоковой передачи (`supportsUsageInStreaming: false`); итоговые данные об использовании отображаются после завершения потока.

  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Правила провайдеров, ссылки на модели и поведение при переключении после сбоя.
  </Card>
  <Card title="Справочник по конфигурации" href="/ru/gateway/configuration-reference" icon="gear">
    Полная схема конфигурации, включая настройки провайдеров.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Панель управления Chutes и документация по API.
  </Card>
  <Card title="Ключи API Chutes" href="https://chutes.ai/settings/api-keys" icon="key">
    Создание ключей API Chutes и управление ими.
  </Card>
</CardGroup>
