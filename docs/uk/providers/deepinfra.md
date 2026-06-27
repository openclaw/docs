---
read_when:
    - Вам потрібен єдиний API-ключ для провідних LLM з відкритим кодом
    - Ви хочете запускати моделі через API DeepInfra в OpenClaw
summary: Використовуйте уніфікований API DeepInfra, щоб отримати доступ до найпопулярніших open source і frontier моделей в OpenClaw
title: DeepInfra
x-i18n:
    generated_at: "2026-06-27T18:09:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 059a556c24d2de2c8c5290b54c78fbc7451dc534238bfc4c725dcfbbd9a2d17f
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra надає **уніфікований API**, який маршрутизує запити до найпопулярніших моделей з відкритим кодом і передових моделей через єдину
кінцеву точку та ключ API. Він сумісний з OpenAI, тому більшість OpenAI SDK працюють після зміни базової URL-адреси.

## Установлення Plugin

Установіть офіційний Plugin, а потім перезапустіть Gateway:

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## Отримання ключа API

1. Перейдіть на [https://deepinfra.com/](https://deepinfra.com/)
2. Увійдіть або створіть обліковий запис
3. Перейдіть до Dashboard / Keys і згенеруйте новий ключ API або використайте автоматично створений

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
      model: { primary: "deepinfra/deepseek-ai/DeepSeek-V4-Flash" },
    },
  },
}
```

## Підтримувані поверхні OpenClaw

Plugin реєструє всі поверхні DeepInfra, що відповідають поточним
контрактам провайдерів OpenClaw. Чат, генерація зображень і генерація відео
динамічно оновлюють свої каталоги моделей із `/v1/openai/models?sort_by=openclaw&filter=with_meta`,
коли налаштовано `DEEPINFRA_API_KEY`; інші поверхні використовують наведені нижче добірні
статичні типові значення.

| Поверхня                 | Типова модель                                                                                        | Конфігурація/інструмент OpenClaw                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Чат / провайдер моделей  | перший запис із тегом чату з живого каталогу (резерв із маніфесту `deepseek-ai/DeepSeek-V4-Flash`)   | `agents.defaults.model`                                  |
| Генерація/редагування зображень | перший запис із тегом `image-gen` з живого каталогу (статичний резерв `black-forest-labs/FLUX-1-schnell`) | `image_generate`, `agents.defaults.imageGenerationModel` |
| Розуміння медіа          | `moonshotai/Kimi-K2.5` для зображень                                                                 | розуміння вхідних зображень                              |
| Мовлення в текст         | `openai/whisper-large-v3-turbo`                                                                       | транскрибування вхідного аудіо                           |
| Текст у мовлення         | `hexgrad/Kokoro-82M`                                                                                  | `messages.tts.provider: "deepinfra"`                     |
| Генерація відео          | перший запис із тегом `video-gen` з живого каталогу (статичний резерв `Pixverse/Pixverse-T2V`)        | `video_generate`, `agents.defaults.videoGenerationModel` |
| Вбудовування пам’яті     | `BAAI/bge-m3`                                                                                         | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra також надає повторне ранжування, класифікацію, виявлення об’єктів та інші
нативні типи моделей. OpenClaw наразі не має повноцінних контрактів провайдерів
для цих категорій, тому цей Plugin поки що їх не реєструє.

## Доступні моделі

OpenClaw динамічно виявляє доступні моделі DeepInfra під час запуску. Використайте
`/models deepinfra`, щоб переглянути повний список доступних моделей.

Будь-яку модель, доступну на [DeepInfra.com](https://deepinfra.com/), можна використовувати з префіксом `deepinfra/`:

```
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...і багато інших
```

## Примітки

- Посилання на моделі мають формат `deepinfra/<provider>/<model>` (наприклад, `deepinfra/Qwen/Qwen3-Max`).
- Типова модель: `deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- Базова URL-адреса: `https://api.deepinfra.com/v1/openai`
- Нативна генерація відео використовує `https://api.deepinfra.com/v1/inference/<model>`.

## Пов’язане

- [Провайдери моделей](/uk/concepts/model-providers)
- [Усі провайдери](/uk/providers/index)
