---
read_when:
    - Вам потрібен єдиний API-ключ для найкращих великих мовних моделей із відкритим кодом
    - Ви хочете запускати моделі через API DeepInfra в OpenClaw
summary: Використовуйте уніфікований API DeepInfra для доступу до найпопулярніших моделей із відкритим кодом і передових моделей в OpenClaw
title: DeepInfra
x-i18n:
    generated_at: "2026-05-06T04:52:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e68c3f764ac91548c2ced0b650e582f6d315ad7f154d19a00f299a3737494cd
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra надає **уніфікований API**, який спрямовує запити до найпопулярніших моделей з відкритим кодом і frontier-моделей через один
endpoint і API-ключ. Він сумісний з OpenAI, тому більшість OpenAI SDK працюють після зміни базового URL.

## Отримання API-ключа

1. Перейдіть на [https://deepinfra.com/](https://deepinfra.com/)
2. Увійдіть або створіть обліковий запис
3. Перейдіть до Dashboard / Keys і згенеруйте новий API-ключ або використайте автоматично створений

## Налаштування CLI

```bash
openclaw onboard --deepinfra-api-key <key>
```

Або задайте змінну середовища:

```bash
export DEEPINFRA_API_KEY="<your-deepinfra-api-key>" # pragma: allowlist secret
```

## Фрагмент конфігурації

```json5
{
  env: { DEEPINFRA_API_KEY: "<your-deepinfra-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "deepinfra/deepseek-ai/DeepSeek-V3.2" },
    },
  },
}
```

## Підтримувані поверхні OpenClaw

Вбудований plugin реєструє всі поверхні DeepInfra, які відповідають поточним
контрактам постачальників OpenClaw:

| Поверхня                  | Модель за замовчуванням            | Конфігурація/інструмент OpenClaw                          |
| ------------------------- | ---------------------------------- | --------------------------------------------------------- |
| Чат / постачальник моделей | `deepseek-ai/DeepSeek-V3.2`        | `agents.defaults.model`                                   |
| Генерація/редагування зображень | `black-forest-labs/FLUX-1-schnell` | `image_generate`, `agents.defaults.imageGenerationModel` |
| Розуміння медіа           | `moonshotai/Kimi-K2.5` для зображень | розуміння вхідних зображень                              |
| Мовлення в текст          | `openai/whisper-large-v3-turbo`    | транскрибування вхідного аудіо                            |
| Текст у мовлення          | `hexgrad/Kokoro-82M`               | `messages.tts.provider: "deepinfra"`                      |
| Генерація відео           | `Pixverse/Pixverse-T2V`            | `video_generate`, `agents.defaults.videoGenerationModel`  |
| Векторні представлення пам’яті | `BAAI/bge-m3`                      | `agents.defaults.memorySearch.provider: "deepinfra"`      |

DeepInfra також надає reranking, класифікацію, виявлення об’єктів та інші
нативні типи моделей. OpenClaw наразі не має повноцінних контрактів постачальників
для цих категорій, тому цей plugin поки їх не реєструє.

## Доступні моделі

OpenClaw динамічно виявляє доступні моделі DeepInfra під час запуску. Використайте
`/models deepinfra`, щоб переглянути повний список доступних моделей.

Будь-яку модель, доступну на [DeepInfra.com](https://deepinfra.com/), можна використовувати з префіксом `deepinfra/`:

```
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/moonshotai/Kimi-K2.5
deepinfra/zai-org/GLM-5.1
...і багато інших
```

## Примітки

- Посилання на моделі мають формат `deepinfra/<provider>/<model>` (наприклад, `deepinfra/Qwen/Qwen3-Max`).
- Модель за замовчуванням: `deepinfra/deepseek-ai/DeepSeek-V3.2`
- Базовий URL: `https://api.deepinfra.com/v1/openai`
- Нативна генерація відео використовує `https://api.deepinfra.com/v1/inference/<model>`.

## Пов’язане

- [Постачальники моделей](/uk/concepts/model-providers)
- [Усі постачальники](/uk/providers/index)
