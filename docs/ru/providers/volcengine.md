---
read_when:
    - Вы хотите использовать модели Volcano Engine или Doubao с OpenClaw
    - Вам нужно настроить API-ключ Volcengine
    - Вы хотите использовать преобразование текста в речь Volcengine Speech
summary: Настройка Volcano Engine (модели Doubao, конечные точки для программирования и Seed Speech TTS)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-06-28T23:41:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7948a26cc898e125d445e9ae091704f5cf442266d29e712c0dcedbe0dc0cce7
    source_path: providers/volcengine.md
    workflow: 16
---

Провайдер Volcengine предоставляет доступ к моделям Doubao и сторонним моделям,
размещенным на Volcano Engine, с отдельными конечными точками для общих и
кодовых рабочих нагрузок. Тот же встроенный Plugin также может зарегистрировать Volcengine Speech как
провайдера TTS.

| Сведения      | Значение                                                   |
| ---------- | ---------------------------------------------------------- |
| Провайдеры | `volcengine` (общие + TTS) + `volcengine-plan` (кодовые)   |
| Аутентификация моделей | `VOLCANO_ENGINE_API_KEY`                        |
| Аутентификация TTS | `VOLCENGINE_TTS_API_KEY` или `BYTEPLUS_SEED_SPEECH_API_KEY` |
| API        | OpenAI-совместимые модели, BytePlus Seed Speech TTS        |

## Начало работы

<Steps>
  <Step title="Set the API key">
    Запустите интерактивную настройку:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Это регистрирует и общего (`volcengine`), и кодового (`volcengine-plan`) провайдеров с помощью одного API-ключа.

  </Step>
  <Step title="Set a default model">
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
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
Для неинтерактивной настройки (CI, скрипты) передайте ключ напрямую:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Провайдеры и конечные точки

| Провайдер         | Конечная точка                           | Сценарий использования |
| ----------------- | ----------------------------------------- | -------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Общие модели |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Кодовые модели |

<Note>
Оба провайдера настраиваются с помощью одного API-ключа. Настройка регистрирует их автоматически.
</Note>

## Встроенный каталог

<Tabs>
  <Tab title="General (volcengine)">
    | Ссылка на модель                             | Название                        | Ввод        | Контекст |
    | -------------------------------------------- | ------------------------------- | ----------- | ------- |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | текст, изображение | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | текст, изображение | 256,000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | текст, изображение | 256,000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | текст, изображение | 200,000 |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | текст, изображение | 128,000 |
  </Tab>
  <Tab title="Coding (volcengine-plan)">
    | Ссылка на модель                                  | Название                 | Ввод  | Контекст |
    | ------------------------------------------------- | ------------------------ | ----- | ------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | текст | 256,000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | текст | 256,000 |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | текст | 200,000 |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | текст | 256,000 |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | текст | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | текст | 256,000 |
  </Tab>
</Tabs>

## Преобразование текста в речь

Volcengine TTS использует HTTP API BytePlus Seed Speech и настраивается
отдельно от API-ключа OpenAI-совместимых моделей Doubao. В консоли BytePlus
откройте Seed Speech > Settings > API Keys и скопируйте API-ключ, затем задайте:

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

Для целей с голосовыми заметками OpenClaw запрашивает у Volcengine нативный для провайдера
`ogg_opus`. Для обычных аудиовложений он запрашивает `mp3`. Псевдонимы провайдера
`bytedance` и `doubao` также указывают на того же провайдера речи.

Идентификатор ресурса по умолчанию — `seed-tts-1.0`, потому что именно его BytePlus выдает
новым API-ключам Seed Speech в проекте по умолчанию. Если у вашего проекта
есть право на TTS 2.0, задайте `VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0`.

<Warning>
`VOLCANO_ENGINE_API_KEY` предназначен для конечных точек моделей ModelArk/Doubao и не является
API-ключом Seed Speech. Для TTS нужен API-ключ Seed Speech из BytePlus Speech
Console либо устаревшая пара AppID/токен из Speech Console.
</Warning>

Устаревшая аутентификация AppID/токен остается поддерживаемой для старых приложений Speech Console:

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Default model after onboarding">
    `openclaw onboard --auth-choice volcengine-api-key` сейчас задает
    `volcengine-plan/ark-code-latest` как модель по умолчанию, одновременно регистрируя
    общий каталог `volcengine`.
  </Accordion>

  <Accordion title="Model picker fallback behavior">
    Во время выбора модели при onboarding/configure вариант аутентификации Volcengine предпочитает
    строки `volcengine/*` и `volcengine-plan/*`. Если эти модели еще не
    загружены, OpenClaw откатывается к нефильтрованному каталогу вместо показа
    пустого средства выбора, ограниченного провайдером.
  </Accordion>

  <Accordion title="Environment variables for daemon processes">
    Если Gateway работает как daemon (launchd/systemd), убедитесь, что переменные окружения
    для моделей и TTS, такие как `VOLCANO_ENGINE_API_KEY`, `VOLCENGINE_TTS_API_KEY`,
    `BYTEPLUS_SEED_SPEECH_API_KEY`, `VOLCENGINE_TTS_APPID` и
    `VOLCENGINE_TTS_TOKEN`, доступны этому процессу (например, в
    `~/.openclaw/.env` или через `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
При запуске OpenClaw как фоновой службы переменные окружения, заданные в вашей
интерактивной оболочке, не наследуются автоматически. См. примечание о daemon выше.
</Warning>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Model selection" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при отказе.
  </Card>
  <Card title="Configuration" href="/ru/gateway/configuration" icon="gear">
    Полный справочник конфигурации для агентов, моделей и провайдеров.
  </Card>
  <Card title="Troubleshooting" href="/ru/help/troubleshooting" icon="wrench">
    Распространенные проблемы и шаги отладки.
  </Card>
  <Card title="FAQ" href="/ru/help/faq" icon="circle-question">
    Часто задаваемые вопросы о настройке OpenClaw.
  </Card>
</CardGroup>
