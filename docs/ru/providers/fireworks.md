---
read_when:
    - Вы хотите использовать Fireworks с OpenClaw
    - Вам нужна переменная окружения с API-ключом Fireworks или идентификатор модели по умолчанию
    - Вы отлаживаете поведение Kimi при отключённом режиме размышлений в Fireworks
summary: Настройка Fireworks (аутентификация + выбор модели)
title: Fireworks
x-i18n:
    generated_at: "2026-07-13T20:12:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 15feed0730ec65d943f103824468490be6616478ece80bedfeb9ad8137506180
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) предоставляет модели с открытыми весами и маршрутизацией через API, совместимый с OpenAI. Установите официальный плагин провайдера Fireworks, чтобы использовать две предварительно добавленные в каталог модели Kimi, а также любую модель Fireworks или идентификатор маршрутизатора во время выполнения.

| Свойство                | Значение                                               |
| ----------------------- | ------------------------------------------------------ |
| Идентификатор провайдера | `fireworks` (псевдоним: `fireworks-ai`)                    |
| Пакет                   | `@openclaw/fireworks-provider`                         |
| Переменная окружения для аутентификации | `FIREWORKS_API_KEY`                                    |
| Флаг первоначальной настройки | `--auth-choice fireworks-api-key`                      |
| Прямой флаг CLI         | `--fireworks-api-key <key>`                            |
| API                     | Совместимый с OpenAI (`openai-completions`)               |
| Базовый URL             | `https://api.fireworks.ai/inference/v1`                |
| Модель по умолчанию     | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| Псевдоним по умолчанию  | `Kimi K2.5 Turbo`                                      |

## Начало работы

<Steps>
  <Step title="Установите плагин">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="Укажите ключ API Fireworks">
    <CodeGroup>

```bash Первоначальная настройка
openclaw onboard --auth-choice fireworks-api-key
```

```bash Прямой флаг
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash Только переменная окружения
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    При первоначальной настройке ключ сохраняется для провайдера `fireworks` в ваших профилях аутентификации, а маршрутизатор Kimi K2.5 Turbo **Fire Pass** назначается моделью по умолчанию.

  </Step>
  <Step title="Убедитесь, что модель доступна">
    ```bash
    openclaw models list --provider fireworks
    ```

    Список должен содержать `Kimi K2.6` и `Kimi K2.5 Turbo (Fire Pass)`. Если `FIREWORKS_API_KEY` не разрешается, `openclaw models status --json` сообщает об отсутствующих учётных данных в разделе `auth.unusableProfiles`.

  </Step>
</Steps>

## Неинтерактивная настройка

Для установки с помощью скриптов или в CI передайте все параметры в командной строке:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Встроенный каталог

| Ссылка на модель                                       | Название                    | Входные данные | Контекст | Макс. объём вывода | Рассуждение          |
| ------------------------------------------------------ | --------------------------- | -------------- | ------- | ------------------ | -------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | текст + изображение | 262,144 | 262,144    | Принудительно отключено |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | текст + изображение | 256,000 | 256,000    | Принудительно отключено (по умолчанию) |

<Note>
  OpenClaw закрепляет для всех моделей Kimi в Fireworks значение `thinking: off`, поскольку Kimi в Fireworks может раскрывать цепочку рассуждений в видимом ответе, если запрос явно не отключает рассуждение. Маршрутизация той же модели напрямую через [Moonshot](/ru/providers/moonshot) сохраняет вывод рассуждений Kimi. Инструкции по переключению между провайдерами см. в разделе [режимы рассуждения](/ru/tools/thinking).
</Note>

## Пользовательские идентификаторы моделей Fireworks

OpenClaw принимает во время выполнения любую модель Fireworks или идентификатор маршрутизатора. Используйте точный идентификатор, указанный Fireworks, и добавьте к нему префикс `fireworks/`. При динамическом разрешении клонируется шаблон Fire Pass (ввод текста и изображений, API, совместимый с OpenAI, нулевая стоимость по умолчанию), а если идентификатор соответствует шаблону Kimi, рассуждение автоматически отключается. Динамические идентификаторы GLM помечаются как поддерживающие только текст, если вы не настроите пользовательскую запись модели с поддержкой изображений на входе.

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
  <Accordion title="Как работает добавление префикса к идентификатору модели">
    Каждая ссылка на модель Fireworks в OpenClaw начинается с `fireworks/`, после которого следует точный идентификатор или путь маршрутизатора с платформы Fireworks. Например:

    - Модель маршрутизатора: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Прямая модель: `fireworks/accounts/fireworks/models/<model-name>`

    При формировании запроса API OpenClaw удаляет префикс `fireworks/` и отправляет оставшийся путь в конечную точку Fireworks как поле `model`, совместимое с OpenAI.

  </Accordion>

  <Accordion title="Почему для Kimi рассуждение принудительно отключено">
    Fireworks предоставляет Kimi без отдельного канала рассуждений, поэтому цепочка рассуждений может появляться в видимом потоке `content`. В каждом запросе к Kimi через Fireworks OpenClaw отправляет `thinking: { type: "disabled" }` и удаляет из полезной нагрузки `reasoning`, `reasoning_effort` и `reasoningEffort` (`extensions/fireworks/stream.ts`). Политика провайдера (`extensions/fireworks/thinking-policy.ts`) объявляет для идентификаторов моделей Kimi только уровень рассуждения `off`, поэтому ручные переключатели `/think` и поверхности политики провайдера остаются согласованными с контрактом среды выполнения.

    Чтобы использовать рассуждения Kimi на всём пути обработки, настройте [провайдер Moonshot](/ru/providers/moonshot) и направьте ту же модель через него.

  </Accordion>

  <Accordion title="Доступность переменной окружения для демона">
    Если Gateway работает как управляемая служба (launchd, systemd, Docker), ключ Fireworks должен быть доступен этому процессу, а не только вашей интерактивной оболочке.

    <Warning>
      Ключ, экспортированный только в интерактивной оболочке, не будет доступен демону launchd или systemd, если это окружение не импортировано и туда. Укажите ключ в `~/.openclaw/.env` или через `env.shellEnv`, чтобы процесс Gateway мог его прочитать.
    </Warning>

    OpenClaw загружает `~/.openclaw/.env` при загрузке конфигурации, поэтому сохранённые там ключи доступны управляемым службам Gateway на всех платформах. После ротации ключа перезапустите Gateway или повторно выполните `openclaw doctor --fix`.

  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Провайдеры моделей" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при переключении после сбоя.
  </Card>
  <Card title="Режимы рассуждения" href="/ru/tools/thinking" icon="brain">
    Уровни `/think`, политики провайдеров и маршрутизация моделей с поддержкой рассуждений.
  </Card>
  <Card title="Moonshot" href="/ru/providers/moonshot" icon="moon">
    Запускайте Kimi с нативным выводом рассуждений через собственный API Moonshot.
  </Card>
  <Card title="Устранение неполадок" href="/ru/help/troubleshooting" icon="wrench">
    Общие инструкции по устранению неполадок и часто задаваемые вопросы.
  </Card>
</CardGroup>
