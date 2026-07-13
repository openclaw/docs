---
read_when:
    - Вы хотите использовать модели Volcano Engine или Doubao с OpenClaw
    - Необходимо настроить ключ API Volcengine
    - Вы хотите использовать преобразование текста в речь Volcengine Speech
summary: Настройка Volcano Engine (модели Doubao, конечные точки для программирования и TTS Seed Speech)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-07-13T20:14:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: e853a1c8847704caedf0ec83c38332569f72105c5e34ad973daf614a2e80550b
    source_path: providers/volcengine.md
    workflow: 16
---

Провайдер Volcengine предоставляет доступ к моделям Doubao и сторонним моделям, размещенным на Volcano Engine, с отдельными конечными точками для общих задач и задач программирования. Тот же встроенный плагин также регистрирует Volcengine Speech как провайдер TTS.

| Сведения     | Значение                                                      |
| ---------- | ---------------------------------------------------------- |
| Провайдеры  | `volcengine` (общие задачи + TTS), `volcengine-plan` (программирование)   |
| Аутентификация моделей | `VOLCANO_ENGINE_API_KEY`                                   |
| Аутентификация TTS   | `VOLCENGINE_TTS_API_KEY` или `BYTEPLUS_SEED_SPEECH_API_KEY` |
| API        | Модели с поддержкой API, совместимого с OpenAI, TTS BytePlus Seed Speech         |

## Начало работы

<Steps>
  <Step title="Задайте ключ API">
    Запустите интерактивную первоначальную настройку:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    При этом с помощью одного ключа API регистрируются как провайдер общего назначения (`volcengine`), так и провайдер для программирования (`volcengine-plan`).

  </Step>
  <Step title="Задайте модель по умолчанию">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="Убедитесь, что модель доступна">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
Для неинтерактивной настройки (CI, сценарии) передайте ключ напрямую:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Провайдеры и конечные точки

| Провайдер          | Конечная точка                                  | Назначение       |
| ----------------- | ----------------------------------------- | -------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Модели общего назначения |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Модели для программирования  |

<Note>
Оба провайдера настраиваются с помощью одного ключа API. При настройке оба регистрируются автоматически, а средство выбора модели провайдера для программирования также повторно использует данные аутентификации провайдера общего назначения (`volcengine-plan` — псевдоним аутентификации для `volcengine`).
</Note>

## Встроенный каталог

<Tabs>
  <Tab title="Общие задачи (volcengine)">
    | Ссылка на модель                                    | Название                            | Входные данные       | Контекст |
    | -------------------------------------------- | ------------------------------- | ----------- | ------- |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | текст, изображение | 128,000 |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | текст, изображение | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | текст, изображение | 256,000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | текст, изображение | 200,000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | текст, изображение | 256,000 |
  </Tab>
  <Tab title="Программирование (volcengine-plan)">
    | Ссылка на модель                                         | Название                     | Входные данные | Контекст |
    | ------------------------------------------------- | ------------------------ | ----- | ------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | текст  | 256,000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | текст  | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | текст  | 256,000 |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | текст  | 200,000 |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | текст  | 256,000 |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | текст  | 256,000 |
  </Tab>
</Tabs>

Оба каталога статические (без вызова обнаружения `/models`) и поддерживают потоковый учет использования, совместимый с OpenAI. Схемы инструментов для обоих провайдеров автоматически удаляют ключевые слова `minLength`, `maxLength`, `minItems`, `maxItems`, `minContains` и `maxContains`, поскольку API вызова инструментов Volcengine отклоняет их.

## Преобразование текста в речь

Volcengine TTS использует HTTP API BytePlus Seed Speech (`voice.ap-southeast-1.bytepluses.com`) и настраивается отдельно от ключа API моделей Doubao, совместимого с OpenAI. В консоли BytePlus откройте Seed Speech > Settings > API Keys, скопируйте ключ API, затем задайте:

```bash
export VOLCENGINE_TTS_API_KEY="byteplus_seed_speech_api_key"
export VOLCENGINE_TTS_RESOURCE_ID="seed-tts-1.0"
```

Затем включите его в `openclaw.json`:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "byteplus_seed_speech_api_key",
          voice: "en_female_anna_mars_bigtts",
          speedRatio: 1.0,
        },
      },
    },
  },
}
```

Доступные поля в `messages.tts.providers.volcengine`: `apiKey`, `voice`, `speedRatio` (0.2-3.0), `emotion`, `cluster`, `resourceId`, `appKey` и `baseUrl`. `!emotion=<value>` также работает как встроенная директива выбора голоса, если разрешено переопределение настройки голоса.

Для целевых объектов голосовых сообщений OpenClaw запрашивает собственный для провайдера формат `ogg_opus`. Для обычных звуковых вложений запрашивается `mp3`. Псевдонимы провайдера `bytedance` и `doubao` также разрешаются в этот речевой провайдер.

Идентификатор ресурса по умолчанию — `seed-tts-1.0`; BytePlus по умолчанию предоставляет это право новым ключам API Seed Speech. Если вашему проекту предоставлено право на TTS 2.0, задайте `VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0`.

<Warning>
`VOLCANO_ENGINE_API_KEY` предназначен для конечных точек моделей ModelArk/Doubao и не является ключом API Seed Speech. Для TTS требуется ключ API Seed Speech из BytePlus Speech Console либо устаревшая пара AppID/токен из Speech Console.
</Warning>

Для старых приложений Speech Console по-прежнему поддерживается устаревшая аутентификация с помощью AppID/токена:

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

Другие необязательные переменные окружения TTS: если заданы, `VOLCENGINE_TTS_VOICE`, `VOLCENGINE_TTS_APP_KEY` и `VOLCENGINE_TTS_BASE_URL` переопределяют соответствующие поля конфигурации `messages.tts.providers.volcengine`.

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Модель по умолчанию после первоначальной настройки">
    `openclaw onboard --auth-choice volcengine-api-key` задает `volcengine-plan/ark-code-latest` как модель по умолчанию и одновременно регистрирует каталог общего назначения `volcengine`.
  </Accordion>

  <Accordion title="Резервное поведение средства выбора модели">
    При выборе модели во время первоначальной настройки или конфигурирования вариант аутентификации Volcengine отдает предпочтение строкам `volcengine/*` и `volcengine-plan/*`. Если эти модели еще не загружены, OpenClaw использует нефильтрованный каталог вместо отображения пустого средства выбора, ограниченного провайдером.
  </Accordion>

  <Accordion title="Переменные окружения для процессов-демонов">
    Если Gateway работает как демон (launchd/systemd), убедитесь, что переменные окружения моделей и TTS, такие как `VOLCANO_ENGINE_API_KEY`, `VOLCENGINE_TTS_API_KEY`, `BYTEPLUS_SEED_SPEECH_API_KEY`, `VOLCENGINE_TTS_APPID` и `VOLCENGINE_TTS_TOKEN`, доступны этому процессу (например, в `~/.openclaw/.env` или через `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
При запуске OpenClaw как фоновой службы переменные окружения, заданные в интерактивной оболочке, не наследуются автоматически. См. примечание о демонах выше.
</Warning>

## См. также

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при переключении на резервный вариант.
  </Card>
  <Card title="Конфигурация" href="/ru/gateway/configuration" icon="gear">
    Полный справочник по конфигурации агентов, моделей и провайдеров.
  </Card>
  <Card title="Устранение неполадок" href="/ru/help/troubleshooting" icon="wrench">
    Распространенные проблемы и действия по отладке.
  </Card>
  <Card title="Часто задаваемые вопросы" href="/ru/help/faq" icon="circle-question">
    Часто задаваемые вопросы о настройке OpenClaw.
  </Card>
</CardGroup>
