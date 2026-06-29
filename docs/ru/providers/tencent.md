---
read_when:
    - Вы хотите использовать предварительную версию Tencent Hy3 с OpenClaw
    - Необходимо настроить ключ API TokenHub
summary: Настройка Tencent Cloud TokenHub для предварительной версии Hy3
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-06-28T23:40:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62bcdd795cc0334f409405fa7c369ed9966854616a89dbc7153f91ee349895ad
    source_path: providers/tencent.md
    workflow: 16
---

Установите официальный Plugin поставщика Tencent Cloud, чтобы получать доступ к Tencent Hy3 preview через конечную точку TokenHub (`tencent-tokenhub`) с помощью OpenAI-совместимого API.

| Свойство             | Значение                                              |
| -------------------- | ----------------------------------------------------- |
| Идентификатор поставщика | `tencent-tokenhub`                                    |
| Пакет                | `@openclaw/tencent-provider`                          |
| Переменная окружения для аутентификации | `TOKENHUB_API_KEY`                                    |
| Флаг адаптации       | `--auth-choice tokenhub-api-key`                      |
| Прямой флаг CLI      | `--tokenhub-api-key <key>`                            |
| API                  | OpenAI-совместимый (`openai-completions`)             |
| Базовый URL по умолчанию | `https://tokenhub.tencentmaas.com/v1`                 |
| Глобальный базовый URL | `https://tokenhub-intl.tencentmaas.com/v1` (переопределение) |
| Модель по умолчанию  | `tencent-tokenhub/hy3-preview`                        |

## Быстрый старт

<Steps>
  <Step title="Установите Plugin">
    ```bash
    openclaw plugins install @openclaw/tencent-provider
    ```
  </Step>
  <Step title="Создайте API-ключ TokenHub">
    Создайте API-ключ в Tencent Cloud TokenHub. Если вы выбираете ограниченную область доступа для ключа, включите **Hy3 preview** в разрешенные модели.
  </Step>
  <Step title="Запустите адаптацию">
    <CodeGroup>

```bash Адаптация
openclaw onboard --auth-choice tokenhub-api-key
```

```bash Прямой флаг
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash Только env
export TOKENHUB_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="Проверьте модель">
    ```bash
    openclaw models list --provider tencent-tokenhub
    ```
  </Step>
</Steps>

## Неинтерактивная настройка

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Встроенный каталог

| Ссылка на модель               | Название               | Ввод  | Контекст | Макс. вывод | Примечания                 |
| ------------------------------ | ---------------------- | ----- | -------- | ----------- | -------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | text  | 256,000  | 64,000      | По умолчанию; с reasoning  |

Hy3 preview — это большая языковая MoE-модель Tencent Hunyuan для reasoning, следования инструкциям с длинным контекстом, кода и агентных рабочих процессов. OpenAI-совместимые примеры Tencent используют `hy3-preview` как идентификатор модели и поддерживают стандартные вызовы инструментов chat-completions, а также `reasoning_effort`.

<Tip>
  Идентификатор модели — `hy3-preview`. Не путайте его с моделями Tencent `HY-3D-*`, которые являются API для 3D-генерации и не являются чат-моделью OpenClaw, настроенной этим поставщиком.
</Tip>

## Многоуровневые цены

Каталог поставщика включает многоуровневые метаданные стоимости, которые масштабируются в зависимости от длины входного окна, поэтому оценки стоимости заполняются без ручных переопределений.

| Диапазон входных токенов | Тариф ввода | Тариф вывода | Чтение из кэша |
| ------------------------ | ----------- | ------------ | -------------- |
| 0 - 16,000               | 0.176       | 0.587        | 0.059          |
| 16,000 - 32,000          | 0.235       | 0.939        | 0.088          |
| 32,000+                  | 0.293       | 1.173        | 0.117          |

Тарифы указаны за миллион токенов в долларах США, как заявлено Tencent. Переопределяйте цены в `models.providers.tencent-tokenhub` только если вам нужна другая поверхность.

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Переопределение конечной точки">
    OpenClaw по умолчанию использует конечную точку Tencent Cloud `https://tokenhub.tencentmaas.com/v1`. Tencent также документирует международную конечную точку TokenHub:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
    ```

    Переопределяйте конечную точку только если этого требует ваша учетная запись или регион TokenHub.

  </Accordion>

  <Accordion title="Доступность окружения для демона">
    Если Gateway работает как управляемый сервис (launchd, systemd, Docker), `TOKENHUB_API_KEY` должен быть виден этому процессу. Задайте его в `~/.openclaw/.env` или через `env.shellEnv`, чтобы среды выполнения launchd, systemd или Docker могли его прочитать.

    <Warning>
      Ключи, экспортированные только в интерактивной оболочке, не видны управляемым процессам Gateway. Используйте файл env или конфигурационный шов для постоянной доступности.
    </Warning>

  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Поставщики моделей" href="/ru/concepts/model-providers" icon="layers">
    Выбор поставщиков, ссылок на модели и поведения при отказе.
  </Card>
  <Card title="Справочник по конфигурации" href="/ru/gateway/configuration" icon="gear">
    Полная схема конфигурации, включая настройки поставщиков.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Страница продукта TokenHub от Tencent Cloud.
  </Card>
  <Card title="Карточка модели Hy3 preview" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Сведения и бенчмарки Tencent Hunyuan Hy3 preview.
  </Card>
</CardGroup>
