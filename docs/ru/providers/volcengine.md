---
read_when:
    - Вы хотите использовать модели Volcano Engine или Doubao с OpenClaw
    - Вам необходимо настроить API-ключ Volcengine
    - Вы хотите использовать преобразование текста в речь Volcengine Speech
summary: Настройка Volcano Engine (модели Doubao, конечные точки для программирования и TTS Seed Speech)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-07-12T11:49:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e853a1c8847704caedf0ec83c38332569f72105c5e34ad973daf614a2e80550b
    source_path: providers/volcengine.md
    workflow: 16
---

Провайдер Volcengine предоставляет доступ к моделям Doubao и сторонним моделям, размещённым в Volcano Engine, с отдельными конечными точками для задач общего назначения и программирования. Тот же встроенный Plugin также регистрирует Volcengine Speech как провайдер TTS.

| Сведения          | Значение                                                   |
| ----------------- | ---------------------------------------------------------- |
| Провайдеры        | `volcengine` (общие задачи + TTS), `volcengine-plan` (программирование) |
| Аутентификация моделей | `VOLCANO_ENGINE_API_KEY`                              |
| Аутентификация TTS | `VOLCENGINE_TTS_API_KEY` или `BYTEPLUS_SEED_SPEECH_API_KEY` |
| API               | OpenAI-совместимые модели, BytePlus Seed Speech TTS         |

## Начало работы

<Steps>
  <Step title="Задайте ключ API">
    Запустите интерактивную первоначальную настройку:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Эта команда регистрирует провайдеры общего назначения (`volcengine`) и программирования (`volcengine-plan`) с помощью одного ключа API.

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

| Провайдер         | Конечная точка                            | Назначение                    |
| ----------------- | ----------------------------------------- | ----------------------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Модели общего назначения      |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Модели для программирования   |

<Note>
Оба провайдера настраиваются с помощью одного ключа API. При настройке оба регистрируются автоматически, а средство выбора моделей провайдера для программирования также использует аутентификацию общего провайдера (`volcengine-plan` является псевдонимом аутентификации `volcengine`).
</Note>

## Встроенный каталог

<Tabs>
  <Tab title="Общие задачи (volcengine)">
    | Ссылка на модель                              | Название                        | Входные данные        | Контекст |
    | --------------------------------------------- | ------------------------------- | --------------------- | -------- |
    | `volcengine/deepseek-v3-2-251201`             | DeepSeek V3.2                   | текст, изображение    | 128,000  |
    | `volcengine/doubao-seed-1-8-251228`           | Doubao Seed 1.8                 | текст, изображение    | 256,000  |
    | `volcengine/doubao-seed-code-preview-251028`  | doubao-seed-code-preview-251028 | текст, изображение    | 256,000  |
    | `volcengine/glm-4-7-251222`                   | GLM 4.7                         | текст, изображение    | 200,000  |
    | `volcengine/kimi-k2-5-260127`                 | Kimi K2.5                       | текст, изображение    | 256,000  |
  </Tab>
  <Tab title="Программирование (volcengine-plan)">
    | Ссылка на модель                                  | Название                 | Входные данные | Контекст |
    | ------------------------------------------------- | ------------------------ | -------------- | -------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | текст          | 256,000  |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | текст          | 256,000  |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | текст          | 256,000  |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | текст          | 200,000  |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | текст          | 256,000  |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | текст          | 256,000  |
  </Tab>
</Tabs>

Оба каталога статичны (вызов обнаружения `/models` не выполняется) и поддерживают потоковый учёт использования, совместимый с OpenAI. Из схем инструментов обоих провайдеров автоматически удаляются ключевые слова `minLength`, `maxLength`, `minItems`, `maxItems`, `minContains` и `maxContains`, поскольку API вызова инструментов Volcengine отклоняет их.

## Преобразование текста в речь

Volcengine TTS использует HTTP API BytePlus Seed Speech (`voice.ap-southeast-1.bytepluses.com`) и настраивается отдельно от ключа API OpenAI-совместимых моделей Doubao. В консоли BytePlus откройте Seed Speech > Settings > API Keys, скопируйте ключ API, затем задайте:

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

Доступные поля в `messages.tts.providers.volcengine`: `apiKey`, `voice`, `speedRatio` (0.2–3.0), `emotion`, `cluster`, `resourceId`, `appKey` и `baseUrl`. `!emotion=<value>` также можно использовать как встроенную директиву голоса, когда разрешено переопределение голосовых настроек.

Для целей голосовых сообщений OpenClaw запрашивает нативный для провайдера формат `ogg_opus`. Для обычных аудиовложений запрашивается `mp3`. Псевдонимы провайдера `bytedance` и `doubao` также разрешаются в этот провайдер синтеза речи.

Идентификатор ресурса по умолчанию — `seed-tts-1.0`; BytePlus по умолчанию предоставляет это право доступа новым ключам API Seed Speech. Если вашему проекту предоставлен доступ к TTS 2.0, задайте `VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0`.

<Warning>
`VOLCANO_ENGINE_API_KEY` предназначен для конечных точек моделей ModelArk/Doubao и не является ключом API Seed Speech. Для TTS требуется ключ API Seed Speech из BytePlus Speech Console либо устаревшая пара AppID и токена из Speech Console.
</Warning>

Устаревшая аутентификация с помощью AppID и токена по-прежнему поддерживается для старых приложений Speech Console:

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

Другие необязательные переменные окружения TTS: `VOLCENGINE_TTS_VOICE`, `VOLCENGINE_TTS_APP_KEY` и `VOLCENGINE_TTS_BASE_URL`. Если они заданы, то переопределяют соответствующие поля конфигурации `messages.tts.providers.volcengine`.

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Модель по умолчанию после первоначальной настройки">
    `openclaw onboard --auth-choice volcengine-api-key` задаёт `volcengine-plan/ark-code-latest` как модель по умолчанию и одновременно регистрирует общий каталог `volcengine`.
  </Accordion>

  <Accordion title="Резервное поведение средства выбора моделей">
    При выборе модели во время первоначальной настройки или конфигурирования вариант аутентификации Volcengine отдаёт предпочтение строкам `volcengine/*` и `volcengine-plan/*`. Если эти модели ещё не загружены, OpenClaw использует нефильтрованный каталог вместо отображения пустого средства выбора, ограниченного провайдером.
  </Accordion>

  <Accordion title="Переменные окружения для процессов-демонов">
    Если Gateway работает как демон (launchd/systemd), убедитесь, что переменные окружения моделей и TTS, такие как `VOLCANO_ENGINE_API_KEY`, `VOLCENGINE_TTS_API_KEY`, `BYTEPLUS_SEED_SPEECH_API_KEY`, `VOLCENGINE_TTS_APPID` и `VOLCENGINE_TTS_TOKEN`, доступны этому процессу (например, через `~/.openclaw/.env` или `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
При запуске OpenClaw как фоновой службы переменные окружения, заданные в интерактивной оболочке, не наследуются автоматически. См. примечание о демоне выше.
</Warning>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при переключении на резервный вариант.
  </Card>
  <Card title="Конфигурация" href="/ru/gateway/configuration" icon="gear">
    Полное справочное руководство по конфигурации агентов, моделей и провайдеров.
  </Card>
  <Card title="Устранение неполадок" href="/ru/help/troubleshooting" icon="wrench">
    Распространённые проблемы и действия по диагностике.
  </Card>
  <Card title="Часто задаваемые вопросы" href="/ru/help/faq" icon="circle-question">
    Часто задаваемые вопросы о настройке OpenClaw.
  </Card>
</CardGroup>
