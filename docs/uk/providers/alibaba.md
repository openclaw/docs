---
read_when:
    - Ви хочете використовувати генерацію відео Alibaba Wan в OpenClaw
    - Вам потрібно налаштувати ключ API Model Studio або DashScope для генерації відео
summary: Генерація відео Wan в Alibaba Model Studio в OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-04-05T22:36:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 97a1eddc7cbd816776b9368f2a926b5ef9ee543f08d151a490023736f67dc635
    source_path: providers/alibaba.md
    workflow: 15
---

# Alibaba Model Studio

OpenClaw постачається з вбудованим провайдером генерації відео `alibaba` для моделей Wan у
Alibaba Model Studio / DashScope.

- Провайдер: `alibaba`
- Бажана автентифікація: `MODELSTUDIO_API_KEY`
- Також приймаються: `DASHSCOPE_API_KEY`, `QWEN_API_KEY`
- API: асинхронна генерація відео DashScope / Model Studio

## Швидкий старт

1. Установіть ключ API:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

2. Установіть модель відео за замовчуванням:

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

## Вбудовані моделі Wan

Вбудований провайдер `alibaba` наразі реєструє:

- `alibaba/wan2.6-t2v`
- `alibaba/wan2.6-i2v`
- `alibaba/wan2.6-r2v`
- `alibaba/wan2.6-r2v-flash`
- `alibaba/wan2.7-r2v`

## Поточні обмеження

- До **1** вихідного відео на запит
- До **1** вхідного зображення
- До **4** вхідних відео
- Тривалість до **10 секунд**
- Підтримуються `size`, `aspectRatio`, `resolution`, `audio` і `watermark`
- Режим еталонного зображення/відео наразі потребує **віддалених URL-адрес http(s)**

## Зв’язок із Qwen

Вбудований провайдер `qwen` також використовує розміщені Alibaba кінцеві точки DashScope для
генерації відео Wan. Використовуйте:

- `qwen/...`, якщо вам потрібна канонічна поверхня провайдера Qwen
- `alibaba/...`, якщо вам потрібна пряма поверхня генерації відео Wan від постачальника

## Пов’язане

- [Генерація відео](/uk/tools/video-generation)
- [Qwen](/uk/providers/qwen)
- [Довідник із конфігурації](/uk/gateway/configuration-reference#agent-defaults)
