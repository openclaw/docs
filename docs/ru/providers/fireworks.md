---
read_when:
    - Вы хотите использовать Fireworks с OpenClaw
    - Вам нужна переменная окружения с ключом API Fireworks или идентификатор модели по умолчанию
    - Вы отлаживаете поведение Kimi с отключенным мышлением на Fireworks
summary: Настройка Fireworks (аутентификация + выбор модели)
title: Fireworks
x-i18n:
    generated_at: "2026-06-28T23:36:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7413ec9ea192921ce9b9ec51da5b0b9ff1030feeef192afbefc938ed200e192e
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) предоставляет open-weight и маршрутизируемые модели через API, совместимый с OpenAI. Установите официальный Plugin провайдера Fireworks, чтобы использовать две заранее каталогизированные модели Kimi и любой идентификатор модели или маршрутизатора Fireworks во время выполнения.

| Свойство            | Значение                                               |
| ------------------- | ------------------------------------------------------ |
| Идентификатор провайдера | `fireworks` (псевдоним: `fireworks-ai`)           |
| Пакет               | `@openclaw/fireworks-provider`                         |
| Переменная окружения авторизации | `FIREWORKS_API_KEY`                      |
| Флаг онбординга     | `--auth-choice fireworks-api-key`                      |
| Прямой флаг CLI     | `--fireworks-api-key <key>`                            |
| API                 | совместимый с OpenAI (`openai-completions`)            |
| Базовый URL         | `https://api.fireworks.ai/inference/v1`                |
| Модель по умолчанию | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| Псевдоним по умолчанию | `Kimi K2.5 Turbo`                                   |

## Начало работы

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="Set the Fireworks API key">
    <CodeGroup>

```bash Онбординг
openclaw onboard --auth-choice fireworks-api-key
```

```bash Прямой флаг
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash Только env
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    Онбординг сохраняет ключ для провайдера `fireworks` в ваших профилях авторизации и устанавливает маршрутизатор **Fire Pass** Kimi K2.5 Turbo как модель по умолчанию.

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider fireworks
    ```

    Список должен включать `Kimi K2.6` и `Kimi K2.5 Turbo (Fire Pass)`. Если `FIREWORKS_API_KEY` не разрешен, `openclaw models status --json` сообщает об отсутствующих учетных данных в `auth.unusableProfiles`.

  </Step>
</Steps>

## Неинтерактивная настройка

Для скриптовых установок или установок в CI передайте все параметры в командной строке:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Встроенный каталог

| Ссылка на модель                                        | Название                    | Ввод         | Контекст | Макс. вывод | Размышление         |
| ------------------------------------------------------ | --------------------------- | ------------ | ------- | ----------- | ------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | текст + изображение | 262,144 | 262,144 | Принудительно выключено |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | текст + изображение | 256,000 | 256,000 | Принудительно выключено (по умолчанию) |

<Note>
  OpenClaw закрепляет для всех моделей Fireworks Kimi значение `thinking: off`, потому что Fireworks отклоняет параметры thinking Kimi в продакшене. Маршрутизация той же модели напрямую через [Moonshot](/ru/providers/moonshot) сохраняет вывод рассуждений Kimi. См. [режимы thinking](/ru/tools/thinking), чтобы переключаться между провайдерами.
</Note>

## Пользовательские идентификаторы моделей Fireworks

OpenClaw принимает любой идентификатор модели или маршрутизатора Fireworks во время выполнения. Используйте точный идентификатор, показанный Fireworks, и добавьте к нему префикс `fireworks/`. Динамическое разрешение клонирует шаблон Fire Pass (ввод текста + изображения, API, совместимый с OpenAI, стоимость по умолчанию ноль) и автоматически отключает thinking, когда идентификатор совпадает с шаблоном Kimi. Динамические идентификаторы GLM помечаются как поддерживающие только текст, если вы не настроите пользовательскую запись модели с вводом изображений.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/models/<your-model-id>",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="How model id prefixing works">
    Каждая ссылка на модель Fireworks в OpenClaw начинается с `fireworks/`, за которым следует точный идентификатор или путь маршрутизатора с платформы Fireworks. Например:

    - Модель маршрутизатора: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Прямая модель: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw удаляет префикс `fireworks/` при создании API-запроса и отправляет оставшийся путь в конечную точку Fireworks как совместимое с OpenAI поле `model`.

  </Accordion>

  <Accordion title="Why thinking is forced off for Kimi">
    Fireworks K2.6 возвращает 400, если запрос содержит параметры `reasoning_*`, хотя Kimi поддерживает thinking через собственный API Moonshot. Политика провайдера (`extensions/fireworks/thinking-policy.ts`) объявляет для идентификаторов моделей Kimi только уровень thinking `off`, поэтому ручные переключения `/think` и поверхности политик провайдера остаются согласованными с контрактом среды выполнения.

    Чтобы использовать рассуждения Kimi от начала до конца, настройте [провайдера Moonshot](/ru/providers/moonshot) и маршрутизируйте ту же модель через него.

  </Accordion>

  <Accordion title="Environment availability for the daemon">
    Если Gateway запускается как управляемая служба (launchd, systemd, Docker), ключ Fireworks должен быть виден этому процессу, а не только вашей интерактивной оболочке.

    <Warning>
      Ключ, экспортированный только в интерактивной оболочке, не поможет демону launchd или systemd, если это окружение также не импортировано туда. Задайте ключ в `~/.openclaw/.env` или через `env.shellEnv`, чтобы сделать его доступным для чтения из процесса gateway.
    </Warning>

    В macOS `openclaw gateway install` уже подключает `~/.openclaw/.env` к файлу окружения LaunchAgent. После ротации ключа повторно выполните установку (или `openclaw doctor --fix`).

  </Accordion>
</AccordionGroup>

## См. также

<CardGroup cols={2}>
  <Card title="Model providers" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения failover.
  </Card>
  <Card title="Thinking modes" href="/ru/tools/thinking" icon="brain">
    Уровни `/think`, политики провайдеров и маршрутизация моделей, поддерживающих рассуждения.
  </Card>
  <Card title="Moonshot" href="/ru/providers/moonshot" icon="moon">
    Запускайте Kimi с нативным выводом thinking через собственный API Moonshot.
  </Card>
  <Card title="Troubleshooting" href="/ru/help/troubleshooting" icon="wrench">
    Общая диагностика и часто задаваемые вопросы.
  </Card>
</CardGroup>
