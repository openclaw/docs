---
read_when:
    - Ви хочете використовувати генерацію відео Wan в Alibaba в OpenClaw
    - Вам потрібно налаштувати API key Model Studio або DashScope для генерації відео
summary: Генерація відео Wan в Alibaba Model Studio в OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-04-23T21:05:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: f7ec2dda6bd172b81067f8a5c797ccac5b06d3ab0b4324167558e58b2b7f868c
    source_path: providers/alibaba.md
    workflow: 15
---

OpenClaw постачається з вбудованим provider-ом генерації відео `alibaba` для моделей Wan у
Alibaba Model Studio / DashScope.

- Provider: `alibaba`
- Бажаний спосіб auth: `MODELSTUDIO_API_KEY`
- Також приймаються: `DASHSCOPE_API_KEY`, `QWEN_API_KEY`
- API: асинхронна генерація відео DashScope / Model Studio

## Початок роботи

<Steps>
  <Step title="Задайте API key">
    ```bash
    openclaw onboard --auth-choice qwen-standard-api-key
    ```
  </Step>
  <Step title="Задайте типову модель відео">
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
  <Step title="Перевірте, що provider доступний">
    ```bash
    openclaw models list --provider alibaba
    ```
  </Step>
</Steps>

<Note>
Підійде будь-який із підтримуваних auth key (`MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`, `QWEN_API_KEY`). Варіант onboarding `qwen-standard-api-key` налаштовує спільні облікові дані DashScope.
</Note>

## Вбудовані моделі Wan

Вбудований provider `alibaba` наразі реєструє:

| Посилання на модель      | Режим                      |
| ------------------------ | -------------------------- |
| `alibaba/wan2.6-t2v`     | Текст-у-відео              |
| `alibaba/wan2.6-i2v`     | Зображення-у-відео         |
| `alibaba/wan2.6-r2v`     | Reference-to-video         |
| `alibaba/wan2.6-r2v-flash` | Швидкий Reference-to-video |
| `alibaba/wan2.7-r2v`     | Reference-to-video         |

## Поточні обмеження

| Параметр               | Обмеження                                                  |
| ---------------------- | ---------------------------------------------------------- |
| Вихідні відео          | До **1** на запит                                          |
| Вхідні зображення      | До **1**                                                   |
| Вхідні відео           | До **4**                                                   |
| Тривалість             | До **10 секунд**                                           |
| Підтримувані елементи керування | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Reference image/video  | Лише віддалені `http(s)` URL                               |

<Warning>
Режим reference image/video наразі потребує **віддалених URL `http(s)`**. Локальні шляхи до файлів не підтримуються для reference-input.
</Warning>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Зв’язок із Qwen">
    Вбудований provider `qwen` також використовує DashScope endpoint-и, розміщені Alibaba, для
    генерації відео Wan. Використовуйте:

    - `qwen/...`, коли хочете канонічну поверхню provider-а Qwen
    - `alibaba/...`, коли хочете пряму vendor-owned поверхню відео Wan

    Докладніше див. у [документації provider-а Qwen](/uk/providers/qwen).

  </Accordion>

  <Accordion title="Пріоритет auth key">
    OpenClaw перевіряє auth key в такому порядку:

    1. `MODELSTUDIO_API_KEY` (бажаний)
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Будь-який із них автентифікує provider `alibaba`.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео та вибір provider-а.
  </Card>
  <Card title="Qwen" href="/uk/providers/qwen" icon="microchip">
    Налаштування provider-а Qwen та інтеграція DashScope.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/configuration-reference#agent-defaults" icon="gear">
    Типові значення агента та конфігурація моделей.
  </Card>
</CardGroup>
