---
read_when:
    - Вам потрібен єдиний ключ API для найкращих LLM із відкритим кодом
    - Ви хочете запускати моделі через API DeepInfra в OpenClaw
summary: Використовуйте уніфікований API DeepInfra для доступу до найпопулярніших моделей із відкритим кодом і передових моделей в OpenClaw
title: DeepInfra
x-i18n:
    generated_at: "2026-07-12T13:41:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f68bac84311d20348007c715803a34451ba8ab0c09beba63366ba5b1b29de05
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra спрямовує запити до популярних моделей із відкритим вихідним кодом і передових моделей через
єдину кінцеву точку, сумісну з OpenAI, та ключ API. Більшість SDK OpenAI працюють
із нею після зміни базової URL-адреси.

## Установлення Plugin

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## Отримання ключа API

1. Увійдіть на [deepinfra.com](https://deepinfra.com/)
2. Перейдіть до Dashboard / Keys і згенеруйте ключ або скористайтеся автоматично створеним

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

## Підтримувані функції

Каталоги моделей для чату, генерації зображень і генерації відео оновлюються
в реальному часі з `https://api.deepinfra.com/v1/openai/models?sort_by=openclaw&filter=with_meta`
після налаштування `DEEPINFRA_API_KEY`. Інші функції використовують наведені нижче статичні
значення за замовчуванням, доки їх не буде переведено на той самий динамічний каталог.

| Функція                  | Модель за замовчуванням                                                                                         | Конфігурація/інструмент OpenClaw                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Чат / постачальник моделей    | перший запис із позначкою чату в динамічному каталозі (статичний резервний варіант `deepseek-ai/DeepSeek-V4-Flash`)           | `agents.defaults.model`                                  |
| Генерація/редагування зображень | перший запис із позначкою `image-gen` у динамічному каталозі (статичний резервний варіант `black-forest-labs/FLUX-1-schnell`) | `image_generate`, `agents.defaults.imageGenerationModel` |
| Розпізнавання медіавмісту      | `moonshotai/Kimi-K2.5` для зображень                                                                     | розпізнавання вхідних зображень                              |
| Перетворення мовлення на текст           | `openai/whisper-large-v3-turbo`                                                                       | транскрибування вхідного аудіо                              |
| Перетворення тексту на мовлення           | `hexgrad/Kokoro-82M`                                                                                  | `messages.tts.provider: "deepinfra"`                     |
| Генерація відео         | статичний резервний варіант `Pixverse/Pixverse-T2V` (наразі DeepInfra не надає динамічних записів `video-gen`)                 | `video_generate`, `agents.defaults.videoGenerationModel` |
| Векторні представлення пам’яті        | `BAAI/bge-m3`                                                                                         | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra також надає повторне ранжування, класифікацію, виявлення об’єктів та інші
власні типи моделей. OpenClaw поки не має контракту постачальника для цих категорій,
тому цей Plugin їх не реєструє.

## Доступні моделі

Після налаштування ключа OpenClaw динамічно виявляє моделі DeepInfra. Скористайтеся
`/models deepinfra` або `openclaw models list --provider deepinfra`, щоб переглянути
поточний список.

Будь-яка модель із [deepinfra.com](https://deepinfra.com/) працює з
префіксом `deepinfra/`:

```text
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...та багато інших
```

## Примітки

- Посилання на моделі мають формат `deepinfra/<provider>/<model>` (наприклад, `deepinfra/Qwen/Qwen3-Max`).
- Модель чату за замовчуванням: `deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- Базова URL-адреса: `https://api.deepinfra.com/v1/openai`
- Власна генерація відео використовує `https://api.deepinfra.com/v1/inference/<model>`.

## Пов’язані матеріали

- [Постачальники моделей](/uk/concepts/model-providers)
- [Усі постачальники](/uk/providers/index)
