---
read_when:
    - Ви хочете використовувати Together AI разом з OpenClaw
    - Потрібна змінна середовища з ключем API або вибір автентифікації CLI
summary: Налаштування Together AI (автентифікація + вибір моделі)
title: Together AI
x-i18n:
    generated_at: "2026-04-28T11:24:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7713c0b1e64014bbdd87a120de0a950b583afd1481338f2c6cccfb2b7da76e7
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) надає доступ до провідних моделей із відкритим кодом, зокрема Llama, DeepSeek, Kimi та інших, через уніфікований API.

| Властивість | Значення                      |
| -------- | ----------------------------- |
| Постачальник | `together`                    |
| Автентифікація | `TOGETHER_API_KEY`            |
| API      | сумісний з OpenAI             |
| Базова URL-адреса | `https://api.together.xyz/v1` |

## Початок роботи

<Steps>
  <Step title="Отримайте API-ключ">
    Створіть API-ключ на
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
Пресет початкового налаштування встановлює `together/moonshotai/Kimi-K2.5` як модель за замовчуванням.
</Note>

## Вбудований каталог

OpenClaw постачається з таким вбудованим каталогом Together:

| Посилання на модель                                          | Назва                                  | Вхідні дані | Контекст   | Примітки                         |
| ------------------------------------------------------------ | -------------------------------------- | ----------- | ---------- | -------------------------------- |
| `together/moonshotai/Kimi-K2.5`                              | Kimi K2.5                              | текст, зображення | 262,144    | Модель за замовчуванням; reasoning увімкнено |
| `together/zai-org/GLM-4.7`                                   | GLM 4.7 Fp8                            | текст       | 202,752    | Текстова модель загального призначення |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`           | Llama 3.3 70B Instruct Turbo           | текст       | 131,072    | Швидка інструкційна модель       |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`         | Llama 4 Scout 17B 16E Instruct         | текст, зображення | 10,000,000 | Мультимодальна                   |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | Llama 4 Maverick 17B 128E Instruct FP8 | текст, зображення | 20,000,000 | Мультимодальна                   |
| `together/deepseek-ai/DeepSeek-V3.1`                         | DeepSeek V3.1                          | текст       | 131,072    | Загальна текстова модель         |
| `together/deepseek-ai/DeepSeek-R1`                           | DeepSeek R1                            | текст       | 131,072    | Модель reasoning                 |
| `together/moonshotai/Kimi-K2-Instruct-0905`                  | Kimi K2-Instruct 0905                  | текст       | 262,144    | Додаткова текстова модель Kimi   |

## Генерація відео

Вбудований Plugin `together` також реєструє генерацію відео через спільний інструмент `video_generate`.

| Властивість          | Значення                              |
| -------------------- | ------------------------------------- |
| Модель відео за замовчуванням | `together/Wan-AI/Wan2.2-T2V-A14B`     |
| Режими               | текст-у-відео, референс із одного зображення |
| Підтримувані параметри | `aspectRatio`, `resolution`           |

Щоб використовувати Together як постачальника відео за замовчуванням:

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
Див. [Генерація відео](/uk/tools/video-generation) щодо спільних параметрів інструмента, вибору постачальника та поведінки failover.
</Tip>

<AccordionGroup>
  <Accordion title="Примітка щодо середовища">
    Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що `TOGETHER_API_KEY` доступний цьому процесу (наприклад, у `~/.openclaw/.env` або через `env.shellEnv`).

    <Warning>
    Ключі, установлені лише у вашій інтерактивній оболонці, не видимі для процесів Gateway, керованих демоном. Використовуйте конфігурацію `~/.openclaw/.env` або `env.shellEnv` для постійної доступності.
    </Warning>

  </Accordion>

  <Accordion title="Усунення несправностей">
    - Перевірте, що ваш ключ працює: `openclaw models list --provider together`
    - Якщо моделі не відображаються, підтвердьте, що API-ключ установлено в правильному середовищі для вашого процесу Gateway.
    - Посилання на моделі мають форму `together/<model-id>`.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Правила постачальників, посилання на моделі та поведінка failover.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента генерації відео та вибір постачальника.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема конфігурації, включно з налаштуваннями постачальників.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Панель керування Together AI, документація API та ціни.
  </Card>
</CardGroup>
