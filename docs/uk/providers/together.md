---
read_when:
    - Ви хочете використовувати Together AI з OpenClaw
    - Потрібна змінна середовища для API-ключа або вибір автентифікації CLI
summary: Налаштування Together AI (автентифікація + вибір моделі)
title: Together AI
x-i18n:
    generated_at: "2026-06-27T18:14:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1f803ae88828a775d93dcf8b0b62e70b1dbd0cf963639121e2995fabfcd280b
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) надає доступ до провідних моделей із відкритим кодом,
зокрема Llama, DeepSeek, Kimi та інших, через уніфікований API.

| Властивість | Значення                      |
| ----------- | ----------------------------- |
| Провайдер   | `together`                    |
| Автентифікація | `TOGETHER_API_KEY`         |
| API         | сумісний з OpenAI             |
| Базова URL-адреса | `https://api.together.xyz/v1` |

## Початок роботи

<Steps>
  <Step title="Отримайте API-ключ">
    Створіть API-ключ на
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys).
  </Step>
  <Step title="Запустіть онбординг">
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

### Неінтерактивний приклад

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

<Note>
Пресет онбордингу встановлює
`together/meta-llama/Llama-3.3-70B-Instruct-Turbo` як модель за замовчуванням.
</Note>

## Вбудований каталог

OpenClaw постачається з цим вбудованим каталогом Together:

| Посилання на модель                                | Назва                        | Ввід              | Контекст | Примітки                    |
| -------------------------------------------------- | ---------------------------- | ----------------- | -------- | --------------------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | текст             | 131,072  | Модель за замовчуванням     |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | текст, зображення | 262,144  | Модель міркування Kimi      |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | текст             | 512,000  | Текстова модель міркування  |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | текст             | 32,768   | Швидка текстова модель      |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | текст             | 202,752  | Текстова модель міркування  |

## Генерація відео

Вбудований plugin `together` також реєструє генерацію відео через
спільний інструмент `video_generate`.

| Властивість           | Значення                                                                 |
| --------------------- | ------------------------------------------------------------------------ |
| Відеомодель за замовчуванням | `together/Wan-AI/Wan2.2-T2V-A14B`                                 |
| Режими                | text-to-video; лише посилання на одне зображення з `Wan-AI/Wan2.2-I2V-A14B` |
| Підтримувані параметри | `aspectRatio`, `resolution`                                             |

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
Див. [Генерація відео](/uk/tools/video-generation), щоб переглянути параметри спільного інструмента,
вибір провайдера та поведінку відмовостійкого перемикання.
</Tip>

<AccordionGroup>
  <Accordion title="Примітка щодо середовища">
    Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що
    `TOGETHER_API_KEY` доступний цьому процесу (наприклад, у
    `~/.openclaw/.env` або через `env.shellEnv`).

    <Warning>
    Ключі, установлені лише в інтерактивній оболонці, не видимі для процесів
    Gateway, керованих демоном. Використовуйте конфігурацію `~/.openclaw/.env` або
    `env.shellEnv` для постійної доступності.
    </Warning>

  </Accordion>

  <Accordion title="Усунення несправностей">
    - Перевірте, що ваш ключ працює: `openclaw models list --provider together`
    - Якщо моделі не з’являються, підтвердьте, що API-ключ задано в правильному
      середовищі для процесу Gateway.
    - Посилання на моделі використовують форму `together/<model-id>`.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Правила провайдера, посилання на моделі та поведінка відмовостійкого перемикання.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Параметри спільного інструмента генерації відео та вибір провайдера.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема конфігурації, включно з налаштуваннями провайдера.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Панель керування Together AI, документація API та ціни.
  </Card>
</CardGroup>
