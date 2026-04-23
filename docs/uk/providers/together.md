---
read_when:
    - Ви хочете використовувати Together AI з OpenClaw
    - Вам потрібна змінна середовища API-ключа або вибір auth у CLI
summary: Налаштування Together AI (auth + вибір моделі)
title: Together AI
x-i18n:
    generated_at: "2026-04-23T21:08:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6a11f212fbef79e399d4a50cec88150bf0b7abf80ad765f0a617786bb051c8e
    source_path: providers/together.md
    workflow: 15
---

[Together AI](https://together.ai) надає доступ до провідних open-source
models, включно з Llama, DeepSeek, Kimi та іншими, через єдиний API.

| Властивість | Значення                      |
| ----------- | ----------------------------- |
| Provider    | `together`                    |
| Auth        | `TOGETHER_API_KEY`            |
| API         | OpenAI-compatible             |
| Base URL    | `https://api.together.xyz/v1` |

## Початок роботи

<Steps>
  <Step title="Отримайте API-ключ">
    Створіть API-ключ на
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys).
  </Step>
  <Step title="Запустіть onboarding">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="Задайте типову модель">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "together/moonshotai/Kimi-K2.5" },
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
Preset onboarding встановлює `together/moonshotai/Kimi-K2.5` як типову
модель.
</Note>

## Вбудований catalog

OpenClaw постачається з таким вбудованим catalog Together:

| Посилання на модель                                         | Назва                                  | Вхід        | Контекст   | Примітки                         |
| ----------------------------------------------------------- | -------------------------------------- | ----------- | ---------- | -------------------------------- |
| `together/moonshotai/Kimi-K2.5`                             | Kimi K2.5                              | text, image | 262,144    | Типова модель; reasoning увімкнено |
| `together/zai-org/GLM-4.7`                                  | GLM 4.7 Fp8                            | text        | 202,752    | Текстова модель загального призначення |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`          | Llama 3.3 70B Instruct Turbo           | text        | 131,072    | Швидка instruction-модель        |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`        | Llama 4 Scout 17B 16E Instruct         | text, image | 10,000,000 | Мультимодальна                   |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | Llama 4 Maverick 17B 128E Instruct FP8 | text, image | 20,000,000 | Мультимодальна                   |
| `together/deepseek-ai/DeepSeek-V3.1`                        | DeepSeek V3.1                          | text        | 131,072    | Загальна текстова модель         |
| `together/deepseek-ai/DeepSeek-R1`                          | DeepSeek R1                            | text        | 131,072    | Модель reasoning                 |
| `together/moonshotai/Kimi-K2-Instruct-0905`                 | Kimi K2-Instruct 0905                  | text        | 262,144    | Додаткова текстова модель Kimi   |

## Генерація відео

Вбудований plugin `together` також реєструє генерацію відео через
спільний інструмент `video_generate`.

| Властивість          | Значення                            |
| -------------------- | ----------------------------------- |
| Типова відеомодель   | `together/Wan-AI/Wan2.2-T2V-A14B`   |
| Режими               | text-to-video, посилання на одне зображення |
| Підтримувані параметри | `aspectRatio`, `resolution`       |

Щоб використовувати Together як типового відеопровайдера:

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
Див. [Генерація відео](/uk/tools/video-generation) для спільних параметрів інструмента,
вибору provider і поведінки failover.
</Tip>

<AccordionGroup>
  <Accordion title="Примітка щодо середовища">
    Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що
    `TOGETHER_API_KEY` доступний для цього процесу (наприклад, у
    `~/.openclaw/.env` або через `env.shellEnv`).

    <Warning>
    Ключі, задані лише у вашій інтерактивній оболонці, не видимі для
    процесів gateway, керованих демоном. Для постійної доступності використовуйте `~/.openclaw/.env` або config `env.shellEnv`.
    </Warning>

  </Accordion>

  <Accordion title="Усунення несправностей">
    - Перевірте, що ваш ключ працює: `openclaw models list --provider together`
    - Якщо моделі не з’являються, переконайтеся, що API-ключ задано в правильному
      середовищі для процесу Gateway.
    - Посилання на моделі мають формат `together/<model-id>`.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Правила provider, посилання на моделі та поведінка failover.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента генерації відео та вибір provider.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема config, включно з налаштуваннями provider.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Панель керування Together AI, документація API та ціни.
  </Card>
</CardGroup>
