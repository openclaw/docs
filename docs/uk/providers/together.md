---
read_when:
    - Ви хочете використовувати Together AI з OpenClaw
    - Вам потрібна змінна середовища з ключем API або вибір автентифікації в CLI
summary: Налаштування Together AI (автентифікація + вибір моделі)
title: Together AI
x-i18n:
    generated_at: "2026-07-12T13:44:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0860ac6e8092bb4eb48d3c0d348d5c42f538e0316d2fa22a99cbb3a9851b1185
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) надає доступ до провідних моделей із відкритим кодом,
зокрема Llama, DeepSeek, Kimi та інших, через уніфікований API.
OpenClaw постачає його як провайдер `together`.

| Властивість | Значення                      |
| ----------- | ----------------------------- |
| Провайдер   | `together`                    |
| Автентифікація | `TOGETHER_API_KEY`         |
| API         | Сумісний з OpenAI             |
| Базова URL-адреса | `https://api.together.xyz/v1` |

## Початок роботи

<Steps>
  <Step title="Отримайте ключ API">
    Створіть ключ API на сторінці
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys).
  </Step>
  <Step title="Запустіть початкове налаштування">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="Установіть модель за замовчуванням">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "together/meta-llama/Llama-3.3-70B-Instruct-Turbo",
          },
        },
      },
    }
    ```
  </Step>
</Steps>

### Приклад неінтерактивного налаштування

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

<Note>
Початкове налаштування встановлює `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`
як модель за замовчуванням.
</Note>

## Вбудований каталог

Вартість указано в доларах США за мільйон токенів.

| Посилання на модель                                 | Назва                        | Вхідні дані     | Контекст | Макс. вивід | Вартість (вхід/вихід) | Примітки                 |
| -------------------------------------------------- | ---------------------------- | ---------------- | -------- | ----------- | --------------------- | ------------------------ |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | текст            | 131,072  | 8,192       | 0.88 / 0.88           | Модель за замовчуванням  |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | текст, зображення | 262,144 | 32,768      | 1.20 / 4.50           | Модель із міркуванням    |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | текст            | 512,000  | 8,192       | 2.10 / 4.40           | Модель із міркуванням    |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | текст            | 32,768   | 8,192       | 0.30 / 0.30           | Швидка, без міркування   |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | текст            | 202,752  | 8,192       | 1.40 / 4.40           | Модель із міркуванням    |

## Генерування відео

Вбудований plugin `together` також реєструє генерування відео через
спільний інструмент `video_generate`.

| Властивість                  | Значення                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Модель відео за замовчуванням | `Wan-AI/Wan2.2-T2V-A14B`                                                                                     |
| Інші моделі                  | `Wan-AI/Wan2.2-I2V-A14B`, `minimax/Hailuo-02`, `Kwai/Kling-2.1-Master`                                        |
| Режими                       | текст у відео; зображення у відео лише з `Wan-AI/Wan2.2-I2V-A14B` (одне еталонне зображення)                  |
| Тривалість                   | 1–10 секунд                                                                                                   |
| Підтримувані параметри       | `size` (обробляється як `<width>x<height>`); `aspectRatio`/`resolution` не зчитуються                          |

Щоб використовувати Together як провайдера відео за замовчуванням:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "together/Wan-AI/Wan2.2-T2V-A14B",
      },
    },
  },
}
```

<Tip>
Відомості про параметри спільного інструмента, вибір провайдера та поведінку
аварійного перемикання див. у розділі [Генерування відео](/uk/tools/video-generation).
</Tip>

<AccordionGroup>
  <Accordion title="Примітка щодо середовища">
    Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що
    `TOGETHER_API_KEY` доступний цьому процесу (наприклад, у
    `~/.openclaw/.env` або через `env.shellEnv`).

    <Warning>
    Ключі, установлені лише в інтерактивній оболонці, недоступні процесам
    Gateway, якими керує демон. Для постійної доступності використовуйте
    `~/.openclaw/.env` або конфігурацію `env.shellEnv`.
    </Warning>

  </Accordion>

  <Accordion title="Усунення несправностей">
    - Перевірте, чи працює ваш ключ: `openclaw models list --provider together`
    - Якщо моделі не відображаються, переконайтеся, що ключ API встановлено в
      правильному середовищі для процесу Gateway.
    - Посилання на моделі мають формат `together/<model-id>`.

  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Провайдери моделей" href="/uk/concepts/model-providers" icon="layers">
    Правила провайдерів, посилання на моделі та поведінка аварійного перемикання.
  </Card>
  <Card title="Генерування відео" href="/uk/tools/video-generation" icon="video">
    Параметри спільного інструмента генерування відео та вибір провайдера.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема конфігурації, зокрема налаштування провайдерів.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Панель керування Together AI, документація API та ціни.
  </Card>
</CardGroup>
