---
read_when:
    - Ви хочете використовувати локальні workflow ComfyUI з OpenClaw
    - Ви хочете використовувати Comfy Cloud із workflow для зображень, відео або музики
    - Вам потрібні ключі конфігурації вбудованого плагіна comfy
summary: Налаштування генерації зображень, відео та музики у workflow ComfyUI в OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-04-06T00:47:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: b15d826622787bfc5fec057007495145366c88e36100e7b4923ef581d801e2a3
    source_path: providers/comfy.md
    workflow: 15
---

# ComfyUI

OpenClaw постачається з вбудованим плагіном `comfy` для запусків ComfyUI на основі workflow.

- Провайдер: `comfy`
- Моделі: `comfy/workflow`
- Спільні поверхні: `image_generate`, `video_generate`
- Інструмент плагіна: `music_generate`
- Автентифікація: не потрібна для локального ComfyUI; `COMFY_API_KEY` або `COMFY_CLOUD_API_KEY` для Comfy Cloud
- API: ComfyUI `/prompt` / `/history` / `/view` і Comfy Cloud `/api/*`

## Що підтримується

- Генерація зображень із JSON workflow
- Редагування зображень з 1 завантаженим еталонним зображенням
- Генерація відео з JSON workflow
- Генерація відео з 1 завантаженим еталонним зображенням
- Генерація музики або аудіо через вбудований інструмент `music_generate`
- Завантаження результатів із налаштованого вузла або з усіх відповідних вузлів виводу

Вбудований плагін працює на основі workflow, тому OpenClaw не намагається зіставити
з вашим графом такі загальні параметри, як `size`, `aspectRatio`, `resolution`, `durationSeconds` або елементи керування у стилі TTS.

## Структура конфігурації

Comfy підтримує спільні налаштування з’єднання верхнього рівня, а також розділи
workflow для кожної можливості:

```json5
{
  models: {
    providers: {
      comfy: {
        mode: "local",
        baseUrl: "http://127.0.0.1:8188",
        image: {
          workflowPath: "./workflows/flux-api.json",
          promptNodeId: "6",
          outputNodeId: "9",
        },
        video: {
          workflowPath: "./workflows/video-api.json",
          promptNodeId: "12",
          outputNodeId: "21",
        },
        music: {
          workflowPath: "./workflows/music-api.json",
          promptNodeId: "3",
          outputNodeId: "18",
        },
      },
    },
  },
}
```

Спільні ключі:

- `mode`: `local` або `cloud`
- `baseUrl`: типово `http://127.0.0.1:8188` для локального режиму або `https://cloud.comfy.org` для хмарного
- `apiKey`: необов’язкова вбудована альтернатива ключу через змінні середовища
- `allowPrivateNetwork`: дозволити приватний/LAN `baseUrl` у хмарному режимі

Ключі для кожної можливості в розділах `image`, `video` або `music`:

- `workflow` або `workflowPath`: обов’язково
- `promptNodeId`: обов’язково
- `promptInputName`: типово `text`
- `outputNodeId`: необов’язково
- `pollIntervalMs`: необов’язково
- `timeoutMs`: необов’язково

Розділи зображень і відео також підтримують:

- `inputImageNodeId`: обов’язково, якщо ви передаєте еталонне зображення
- `inputImageInputName`: типово `image`

## Зворотна сумісність

Наявна конфігурація зображень верхнього рівня все ще працює:

```json5
{
  models: {
    providers: {
      comfy: {
        workflowPath: "./workflows/flux-api.json",
        promptNodeId: "6",
        outputNodeId: "9",
      },
    },
  },
}
```

OpenClaw трактує цю застарілу форму як конфігурацію workflow для зображень.

## Workflow зображень

Установіть типову модель для генерації зображень:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "comfy/workflow",
      },
    },
  },
}
```

Приклад редагування з еталонним зображенням:

```json5
{
  models: {
    providers: {
      comfy: {
        image: {
          workflowPath: "./workflows/edit-api.json",
          promptNodeId: "6",
          inputImageNodeId: "7",
          inputImageInputName: "image",
          outputNodeId: "9",
        },
      },
    },
  },
}
```

## Workflow відео

Установіть типову модель для генерації відео:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "comfy/workflow",
      },
    },
  },
}
```

Workflow відео Comfy наразі підтримують text-to-video та image-to-video через
налаштований граф. OpenClaw не передає вхідні відео в workflow Comfy.

## Workflow музики

Вбудований плагін реєструє інструмент `music_generate` для визначених workflow
аудіо- або музичних результатів:

```text
/tool music_generate prompt="Warm ambient synth loop with soft tape texture"
```

Використовуйте розділ конфігурації `music`, щоб вказати ваш JSON workflow аудіо та
вузол виводу.

## Comfy Cloud

Використовуйте `mode: "cloud"` і один із таких варіантів:

- `COMFY_API_KEY`
- `COMFY_CLOUD_API_KEY`
- `models.providers.comfy.apiKey`

Хмарний режим усе ще використовує ті самі розділи workflow `image`, `video` і `music`.

## Live-тести

Для вбудованого плагіна доступне opt-in покриття Live-тестами:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Live-тест пропускає окремі сценарії для зображень, відео або музики, якщо не
налаштовано відповідний розділ workflow Comfy.

## Пов’язане

- [Генерація зображень](/uk/tools/image-generation)
- [Генерація відео](/uk/tools/video-generation)
- [Генерація музики](/tools/music-generation)
- [Каталог провайдерів](/uk/providers/index)
- [Довідник із конфігурації](/uk/gateway/configuration-reference#agent-defaults)
