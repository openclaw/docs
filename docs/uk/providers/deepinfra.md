---
read_when:
    - Вам потрібен один API-ключ для найкращих LLM з відкритим кодом
    - Ви хочете запускати моделі через API DeepInfra в OpenClaw
summary: Використовуйте уніфікований API DeepInfra для доступу до найпопулярніших моделей з відкритим кодом і frontier-моделей в OpenClaw
x-i18n:
    generated_at: "2026-04-28T00:35:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22a178e7ac582e094f82f5779a9a963e0bf77b1b19820f74725255b6be0b0593
    source_path: providers/deepinfra.md
    workflow: 15
---

# DeepInfra

DeepInfra надає **уніфікований API**, який маршрутизує запити до найпопулярніших моделей з відкритим кодом і frontier-моделей через одну
кінцеву точку та API-ключ. Він сумісний з OpenAI, тому більшість SDK OpenAI працюють, якщо змінити base URL.

## Отримання API-ключа

1. Перейдіть на [https://deepinfra.com/](https://deepinfra.com/)
2. Увійдіть або створіть обліковий запис
3. Перейдіть до Dashboard / Keys і згенеруйте новий API-ключ або використайте автоматично створений

## Налаштування CLI

```bash
openclaw onboard --deepinfra-api-key <key>
```

Або встановіть змінну середовища:

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
контрактам провайдерів OpenClaw:

| Поверхня                 | Модель за замовчуванням            | Конфігурація/інструмент OpenClaw                        |
| ------------------------ | ---------------------------------- | ------------------------------------------------------- |
| Чат / провайдер моделі   | `deepseek-ai/DeepSeek-V3.2`        | `agents.defaults.model`                                 |
| Генерація/редагування зображень | `black-forest-labs/FLUX-1-schnell` | `image_generate`, `agents.defaults.imageGenerationModel` |
| Розуміння медіа          | `moonshotai/Kimi-K2.5` для зображень | розуміння вхідних зображень                           |
| Мовлення в текст         | `openai/whisper-large-v3-turbo`    | транскрибування вхідного аудіо                          |
| Текст у мовлення         | `hexgrad/Kokoro-82M`               | `messages.tts.provider: "deepinfra"`                    |
| Генерація відео          | `Pixverse/Pixverse-T2V`            | `video_generate`, `agents.defaults.videoGenerationModel` |
| Ембедінги пам’яті        | `BAAI/bge-m3`                      | `agents.defaults.memorySearch.provider: "deepinfra"`    |

DeepInfra також надає reranking, класифікацію, object-detection та інші
власні типи моделей. OpenClaw наразі не має першокласних контрактів
провайдерів для цих категорій, тому цей plugin поки що їх не реєструє.

## Доступні моделі

OpenClaw динамічно виявляє доступні моделі DeepInfra під час запуску. Використовуйте
`/models deepinfra`, щоб переглянути повний список доступних моделей.

Будь-яку модель, доступну на [DeepInfra.com](https://deepinfra.com/), можна використовувати з префіксом `deepinfra/`:

```
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/moonshotai/Kimi-K2.5
deepinfra/zai-org/GLM-5.1
...та багато інших
```

## Примітки

- Посилання на моделі мають формат `deepinfra/<provider>/<model>` (наприклад, `deepinfra/Qwen/Qwen3-Max`).
- Модель за замовчуванням: `deepinfra/deepseek-ai/DeepSeek-V3.2`
- Base URL: `https://api.deepinfra.com/v1/openai`
- Власна генерація відео використовує `https://api.deepinfra.com/v1/inference/<model>`.
