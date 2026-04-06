---
read_when:
    - Генерування музики або аудіо через агента
    - Налаштування інструментів генерації музики, наданих плагінами
    - Розуміння параметрів інструмента music_generate
summary: Генеруйте музику або аудіо за допомогою інструментів, наданих плагінами, таких як робочі процеси ComfyUI
title: Генерація музики
x-i18n:
    generated_at: "2026-04-06T00:47:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 625fe7cd03f88541104d21da12dc318344e8d82fd2ec0bf1f7c0fb817dd14c62
    source_path: tools/music-generation.md
    workflow: 15
---

# Генерація музики

Інструмент `music_generate` дає агенту змогу створювати аудіофайли, коли плагін реєструє підтримку генерації музики.

Вбудований плагін `comfy` наразі надає `music_generate` за допомогою графа ComfyUI, налаштованого через workflow.

## Швидкий старт

1. Налаштуйте `models.providers.comfy.music` за допомогою JSON workflow і вузлів prompt/output.
2. Якщо ви використовуєте Comfy Cloud, задайте `COMFY_API_KEY` або `COMFY_CLOUD_API_KEY`.
3. Попросіть агента згенерувати музику або викличте інструмент безпосередньо.

Приклад:

```text
/tool music_generate prompt="Warm ambient synth loop with soft tape texture"
```

## Параметри інструмента

| Параметр   | Тип    | Опис                                                |
| ---------- | ------ | --------------------------------------------------- |
| `prompt`   | string | Запит для генерації музики або аудіо                |
| `action`   | string | `"generate"` (типово) або `"list"`                  |
| `model`    | string | Перевизначення постачальника/моделі. Наразі `comfy/workflow` |
| `filename` | string | Підказка імені вихідного файла для збереженого аудіофайла |

## Поточна підтримка постачальників

| Постачальник | Модель     | Примітки                         |
| ------------ | ---------- | -------------------------------- |
| ComfyUI      | `workflow` | Музика або аудіо, визначені workflow |

## Live test

Opt-in live coverage for the bundled ComfyUI music path:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Файл live-тесту також охоплює робочі процеси comfy для зображень і відео, якщо ці розділи налаштовані.

## Пов’язане

- [ComfyUI](/providers/comfy)
- [Огляд інструментів](/uk/tools)
