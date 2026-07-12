---
read_when:
    - Вы хотите использовать Fireworks с OpenClaw
    - Вам потребуется переменная окружения с ключом Fireworks API или идентификатор модели по умолчанию
    - Вы отлаживаете поведение Kimi с отключённым режимом размышлений на Fireworks
summary: Настройка Fireworks (аутентификация и выбор модели)
title: Fireworks
x-i18n:
    generated_at: "2026-07-12T11:47:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15feed0730ec65d943f103824468490be6616478ece80bedfeb9ad8137506180
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) предоставляет модели с открытыми весами и маршрутизируемые модели через API, совместимый с OpenAI. Установите официальный Plugin провайдера Fireworks, чтобы использовать две предварительно добавленные в каталог модели Kimi, а также любую модель или идентификатор маршрутизатора Fireworks во время выполнения.

| Свойство                | Значение                                               |
| ----------------------- | ------------------------------------------------------ |
| Идентификатор провайдера | `fireworks` (псевдоним: `fireworks-ai`)                |
| Пакет                   | `@openclaw/fireworks-provider`                         |
| Переменная окружения для аутентификации | `FIREWORKS_API_KEY`                        |
| Флаг первоначальной настройки | `--auth-choice fireworks-api-key`                 |
| Прямой флаг CLI         | `--fireworks-api-key <key>`                            |
| API                     | Совместимый с OpenAI (`openai-completions`)            |
| Базовый URL             | `https://api.fireworks.ai/inference/v1`                |
| Модель по умолчанию     | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| Псевдоним по умолчанию  | `Kimi K2.5 Turbo`                                      |

## Начало работы

<Steps>
  <Step title="Установите Plugin">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="Задайте ключ API Fireworks">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice fireworks-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash Env only
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    При первоначальной настройке ключ сохраняется для провайдера `fireworks` в ваших профилях аутентификации, а маршрутизатор Kimi K2.5 Turbo **Fire Pass** назначается моделью по умолчанию.

  </Step>
  <Step title="Убедитесь, что модель доступна">
    ```bash
    openclaw models list --provider fireworks
    ```

    Список должен содержать `Kimi K2.6` и `Kimi K2.5 Turbo (Fire Pass)`. Если значение `FIREWORKS_API_KEY` не удалось определить, команда `openclaw models status --json` сообщает об отсутствующих учётных данных в `auth.unusableProfiles`.

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

| Ссылка на модель                                       | Название                    | Входные данные    | Контекст | Макс. объём вывода | Рассуждение                 |
| ------------------------------------------------------ | --------------------------- | ----------------- | -------- | ------------------ | --------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | текст + изображение | 262,144 | 262,144            | Принудительно отключено      |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | текст + изображение | 256,000 | 256,000            | Принудительно отключено (по умолчанию) |

<Note>
  OpenClaw фиксирует для всех моделей Kimi в Fireworks значение `thinking: off`, поскольку Kimi в Fireworks может выводить цепочку рассуждений в видимый ответ, если запрос явно не отключает рассуждение. При маршрутизации той же модели напрямую через [Moonshot](/ru/providers/moonshot) вывод рассуждений Kimi сохраняется. Сведения о переключении между провайдерами см. в разделе [режимы рассуждения](/ru/tools/thinking).
</Note>

## Пользовательские идентификаторы моделей Fireworks

OpenClaw принимает во время выполнения любой идентификатор модели или маршрутизатора Fireworks. Используйте точный идентификатор, указанный в Fireworks, с префиксом `fireworks/`. При динамическом разрешении клонируется шаблон Fire Pass (входные данные: текст + изображение, API, совместимый с OpenAI, нулевая стоимость по умолчанию), а рассуждение автоматически отключается, если идентификатор соответствует шаблону Kimi. Динамические идентификаторы GLM помечаются как поддерживающие только текст, если вы не настроите пользовательскую запись модели с поддержкой изображений на входе.

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

    При формировании запроса API OpenClaw удаляет префикс `fireworks/` и отправляет оставшийся путь конечной точке Fireworks в поле `model`, совместимом с OpenAI.

  </Accordion>

  <Accordion title="Почему рассуждение для Kimi принудительно отключено">
    Fireworks предоставляет Kimi без отдельного канала рассуждений, поэтому цепочка рассуждений может появиться в видимом потоке `content`. В каждом запросе Kimi к Fireworks OpenClaw отправляет `thinking: { type: "disabled" }` и удаляет из полезной нагрузки `reasoning`, `reasoning_effort` и `reasoningEffort` (`extensions/fireworks/stream.ts`). Политика провайдера (`extensions/fireworks/thinking-policy.ts`) объявляет для идентификаторов моделей Kimi только уровень рассуждения `off`, поэтому ручные переключения `/think` и интерфейсы политики провайдера остаются согласованными с контрактом среды выполнения.

    Чтобы использовать рассуждения Kimi на всём пути обработки, настройте [провайдер Moonshot](/ru/providers/moonshot) и направьте через него ту же модель.

  </Accordion>

  <Accordion title="Доступность переменных окружения для демона">
    Если Gateway работает как управляемая служба (launchd, systemd, Docker), ключ Fireworks должен быть доступен этому процессу, а не только вашей интерактивной оболочке.

    <Warning>
      Ключ, экспортированный только в интерактивной оболочке, не будет доступен демону launchd или systemd, если окружение также не импортировано туда. Задайте ключ в `~/.openclaw/.env` или через `env.shellEnv`, чтобы процесс Gateway мог его прочитать.
    </Warning>

    OpenClaw загружает `~/.openclaw/.env` при загрузке конфигурации, поэтому хранящиеся там ключи становятся доступны управляемым службам Gateway на всех платформах. После ротации ключа перезапустите Gateway или повторно выполните `openclaw doctor --fix`.

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
    Запуск Kimi с нативным выводом рассуждений через собственный API Moonshot.
  </Card>
  <Card title="Устранение неполадок" href="/ru/help/troubleshooting" icon="wrench">
    Общие сведения об устранении неполадок и часто задаваемые вопросы.
  </Card>
</CardGroup>
