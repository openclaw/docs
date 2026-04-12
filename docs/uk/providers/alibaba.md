---
read_when:
    - Ви хочете використовувати генерацію відео Alibaba Wan в OpenClaw
    - Для генерації відео вам потрібно налаштувати API-ключ Model Studio або DashScope
summary: Генерація відео Wan в Alibaba Model Studio у OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-04-12T10:33:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6e97d929952cdba7740f5ab3f6d85c18286b05596a4137bf80bbc8b54f32662
    source_path: providers/alibaba.md
    workflow: 15
---

# Alibaba Model Studio

OpenClaw постачається з вбудованим провайдером генерації відео `alibaba` для моделей Wan на
Alibaba Model Studio / DashScope.

- Провайдер: `alibaba`
- Бажана автентифікація: `MODELSTUDIO_API_KEY`
- Також підтримуються: `DASHSCOPE_API_KEY`, `QWEN_API_KEY`
- API: асинхронна генерація відео DashScope / Model Studio

## Початок роботи

<Steps>
  <Step title="Налаштуйте API-ключ">
    ```bash
    openclaw onboard --auth-choice qwen-standard-api-key
    ```
  </Step>
  <Step title="Налаштуйте модель відео за замовчуванням">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "alibaba/wan2.6-t2v",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Перевірте, що провайдер доступний">
    ```bash
    openclaw models list --provider alibaba
    ```
  </Step>
</Steps>

<Note>
Підійде будь-який із підтримуваних ключів автентифікації (`MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`, `QWEN_API_KEY`). Варіант онбордингу `qwen-standard-api-key` налаштовує спільні облікові дані DashScope.
</Note>

## Вбудовані моделі Wan

Вбудований провайдер `alibaba` наразі реєструє:

| Посилання на модель       | Режим                     |
| ------------------------- | ------------------------- |
| `alibaba/wan2.6-t2v`       | Текст у відео             |
| `alibaba/wan2.6-i2v`       | Зображення у відео        |
| `alibaba/wan2.6-r2v`       | Референс у відео          |
| `alibaba/wan2.6-r2v-flash` | Референс у відео (швидко) |
| `alibaba/wan2.7-r2v`       | Референс у відео          |

## Поточні обмеження

| Параметр              | Обмеження                                                |
| --------------------- | -------------------------------------------------------- |
| Вихідні відео         | До **1** на запит                                        |
| Вхідні зображення     | До **1**                                                 |
| Вхідні відео          | До **4**                                                 |
| Тривалість            | До **10 секунд**                                         |
| Підтримувані елементи керування | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Референсне зображення/відео | Лише віддалені URL `http(s)`                            |

<Warning>
Режим референсного зображення/відео наразі вимагає **віддалених URL `http(s)`**. Локальні шляхи до файлів для референсних вхідних даних не підтримуються.
</Warning>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Зв’язок із Qwen">
    Вбудований провайдер `qwen` також використовує розміщені Alibaba кінцеві точки DashScope для
    генерації відео Wan. Використовуйте:

    - `qwen/...`, якщо вам потрібна канонічна поверхня провайдера Qwen
    - `alibaba/...`, якщо вам потрібна пряма поверхня генерації відео Wan, що належить постачальнику

    Докладніше див. у [документації провайдера Qwen](/uk/providers/qwen).

  </Accordion>

  <Accordion title="Пріоритет ключів автентифікації">
    OpenClaw перевіряє ключі автентифікації в такому порядку:

    1. `MODELSTUDIO_API_KEY` (бажано)
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Будь-який із цих ключів автентифікує провайдер `alibaba`.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео та вибір провайдера.
  </Card>
  <Card title="Qwen" href="/uk/providers/qwen" icon="microchip">
    Налаштування провайдера Qwen та інтеграція DashScope.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference#agent-defaults" icon="gear">
    Значення агента за замовчуванням і конфігурація моделей.
  </Card>
</CardGroup>
