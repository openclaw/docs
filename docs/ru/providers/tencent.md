---
read_when:
    - Вы хотите использовать Tencent hy3 с OpenClaw
    - Необходимо настроить API-ключ TokenHub или TokenPlan
summary: Настройка Tencent Cloud TokenHub и TokenPlan для hy3
title: Tencent Cloud (TokenHub / TokenPlan)
x-i18n:
    generated_at: "2026-07-13T18:31:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 5c2ffb8ab824539c7765d38e4332c30a6dd371fdc19be825f2ad9af0197fa256
    source_path: providers/tencent.md
    workflow: 16
---

Установите официальный плагин провайдера Tencent Cloud, чтобы получить доступ к Tencent Hy3 через две конечные точки — TokenHub (`tencent-tokenhub`) и TokenPlan (`tencent-tokenplan`) — с помощью API, совместимого с OpenAI.

| Свойство                  | Значение                                              |
| ------------------------- | ----------------------------------------------------- |
| Идентификаторы провайдеров | `tencent-tokenhub`, `tencent-tokenplan`               |
| Пакет                     | `@openclaw/tencent-provider`                                    |
| Переменная окружения для аутентификации TokenHub | `TOKENHUB_API_KEY`                     |
| Переменная окружения для аутентификации TokenPlan | `TOKENPLAN_API_KEY`                    |
| Флаг первоначальной настройки TokenHub | `--auth-choice tokenhub-api-key`                       |
| Флаг первоначальной настройки TokenPlan | `--auth-choice tokenplan-api-key`                      |
| Прямой флаг CLI для TokenHub | `--tokenhub-api-key <key>`                                 |
| Прямой флаг CLI для TokenPlan | `--tokenplan-api-key <key>`                                |
| API                       | Совместимый с OpenAI (`openai-completions`)             |
| Базовый URL TokenHub      | `https://tokenhub.tencentmaas.com/v1`                                    |
| Глобальный базовый URL TokenHub | `https://tokenhub-intl.tencentmaas.com/v1` (переопределение)             |
| Базовый URL TokenPlan     | `https://api.lkeap.cloud.tencent.com/plan/v3`                                    |
| Модель по умолчанию       | `tencent-tokenhub/hy3`                                    |

## Быстрый старт

<Steps>
  <Step title="Создайте ключ API Tencent">
    Создайте ключ API для Tencent Cloud TokenHub и TokenPlan. Если вы выберете для ключа ограниченную область доступа, добавьте **hy3** (и **hy3 preview**, если планируете использовать эту модель в TokenHub) в список разрешённых моделей.
  </Step>
  <Step title="Запустите первоначальную настройку">
    <CodeGroup>

```bash Первоначальная настройка TokenHub
openclaw onboard --auth-choice tokenhub-api-key
```

```bash Прямой флаг TokenHub
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash Первоначальная настройка TokenPlan
openclaw onboard --auth-choice tokenplan-api-key
```

```bash Прямой флаг TokenPlan
openclaw onboard --non-interactive \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY"
```

```bash Только переменные окружения
export TOKENHUB_API_KEY=...
export TOKENPLAN_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="Проверьте модель">
    ```bash
    openclaw models list --provider tencent-tokenhub
    openclaw models list --provider tencent-tokenplan
    ```
  </Step>
</Steps>

## Неинтерактивная настройка

```bash
# TokenHub
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk

# TokenPlan
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY" \
  --skip-health \
  --accept-risk
```

<Note>
`--accept-risk` обязателен вместе с `--non-interactive`.
</Note>

## Встроенный каталог

| Ссылка на модель                | Название               | Входные данные | Контекст | Максимальный вывод | Примечания                |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | ----------------- |
| `tencent-tokenhub/hy3-preview` | hy3 preview (TokenHub) | текст  | 256,000 | 64,000     | поддерживает рассуждения |
| `tencent-tokenhub/hy3`         | hy3 (TokenHub)         | текст  | 256,000 | 64,000     | поддерживает рассуждения |
| `tencent-tokenplan/hy3`        | hy3 (TokenPlan)        | текст  | 256,000 | 64,000     | поддерживает рассуждения |

hy3 — это большая языковая MoE-модель Tencent Hunyuan для рассуждений, выполнения инструкций с длинным контекстом, работы с кодом и агентных рабочих процессов. В примерах Tencent для API, совместимого с OpenAI, идентификатор модели указан как `hy3`; также поддерживаются стандартный вызов инструментов через Chat Completions и `reasoning_effort`.

<Tip>
  Идентификатор модели — `hy3`. Не путайте её с моделями Tencent `HY-3D-*`: это API для генерации 3D-контента, а не чат-модель OpenClaw, настраиваемая этим провайдером.
</Tip>

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Переопределение конечной точки">
    Во встроенном каталоге OpenClaw используется конечная точка Tencent Cloud `https://tokenhub.tencentmaas.com/v1`. Переопределяйте её только в том случае, если для вашей учётной записи или региона TokenHub требуется другая конечная точка:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://your-endpoint/v1"
    ```

  </Accordion>

  <Accordion title="Доступность переменных окружения для фоновой службы">
    Если Gateway работает как управляемая служба (launchd, systemd, Docker), `TOKENHUB_API_KEY` и `TOKENPLAN_API_KEY` должны быть доступны этому процессу. Задайте их в `~/.openclaw/.env` или через `env.shellEnv`, чтобы окружения выполнения launchd, systemd или Docker могли их прочитать.

    <Warning>
      Ключи, экспортированные только в интерактивной оболочке, недоступны управляемым процессам Gateway. Для постоянной доступности используйте файл переменных окружения или механизм конфигурации.
    </Warning>

  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Провайдеры моделей" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при переключении после сбоя.
  </Card>
  <Card title="Справочник по конфигурации" href="/ru/gateway/configuration-reference" icon="gear">
    Полная схема конфигурации, включая настройки провайдеров.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Страница продукта TokenHub от Tencent Cloud.
  </Card>
  <Card title="Карточка предварительной версии модели Hy3" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Подробные сведения и результаты тестирования предварительной версии Tencent Hunyuan Hy3.
  </Card>
</CardGroup>
