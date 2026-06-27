---
read_when:
    - Ви хочете використовувати попередню версію Tencent Hy3 з OpenClaw
    - Вам потрібно налаштувати API-ключ TokenHub
summary: Налаштування Tencent Cloud TokenHub для попередньої версії Hy3
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-06-27T18:14:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62bcdd795cc0334f409405fa7c369ed9966854616a89dbc7153f91ee349895ad
    source_path: providers/tencent.md
    workflow: 16
---

Встановіть офіційний Plugin постачальника Tencent Cloud, щоб отримати доступ до попередньої версії Tencent Hy3 через кінцеву точку TokenHub (`tencent-tokenhub`) за допомогою OpenAI-сумісного API.

| Властивість                | Значення                                              |
| -------------------------- | ----------------------------------------------------- |
| Ідентифікатор постачальника | `tencent-tokenhub`                                    |
| Пакет                      | `@openclaw/tencent-provider`                          |
| Змінна середовища автентифікації | `TOKENHUB_API_KEY`                                    |
| Прапорець онбордингу       | `--auth-choice tokenhub-api-key`                      |
| Прямий прапорець CLI       | `--tokenhub-api-key <key>`                            |
| API                        | OpenAI-сумісний (`openai-completions`)                |
| Базова URL-адреса за замовчуванням | `https://tokenhub.tencentmaas.com/v1`                 |
| Глобальна базова URL-адреса | `https://tokenhub-intl.tencentmaas.com/v1` (перевизначення) |
| Модель за замовчуванням    | `tencent-tokenhub/hy3-preview`                        |

## Швидкий старт

<Steps>
  <Step title="Встановіть Plugin">
    ```bash
    openclaw plugins install @openclaw/tencent-provider
    ```
  </Step>
  <Step title="Створіть API-ключ TokenHub">
    Створіть API-ключ у Tencent Cloud TokenHub. Якщо ви вибираєте обмежену область доступу для ключа, включіть **Hy3 preview** до дозволених моделей.
  </Step>
  <Step title="Запустіть онбординг">
    <CodeGroup>

```bash Онбординг
openclaw onboard --auth-choice tokenhub-api-key
```

```bash Прямий прапорець
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash Лише середовище
export TOKENHUB_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="Перевірте модель">
    ```bash
    openclaw models list --provider tencent-tokenhub
    ```
  </Step>
</Steps>

## Неінтерактивне налаштування

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Вбудований каталог

| Посилання на модель            | Назва                  | Вхідні дані | Контекст | Максимальний вивід | Примітки                    |
| ------------------------------ | ---------------------- | ----------- | -------- | ------------------ | --------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | text        | 256,000  | 64,000             | За замовчуванням; з підтримкою міркування |

Hy3 preview — це велика мовна MoE-модель Tencent Hunyuan для міркування, виконання інструкцій із довгим контекстом, коду та агентних робочих процесів. OpenAI-сумісні приклади Tencent використовують `hy3-preview` як ідентифікатор моделі та підтримують стандартні виклики інструментів chat-completions, а також `reasoning_effort`.

<Tip>
  Ідентифікатор моделі — `hy3-preview`. Не плутайте його з моделями Tencent `HY-3D-*`, які є API для 3D-генерації та не є чат-моделлю OpenClaw, налаштованою цим постачальником.
</Tip>

## Рівневе ціноутворення

Каталог постачальника постачається з рівневими метаданими вартості, які масштабуються залежно від довжини вхідного вікна, тому оцінки вартості заповнюються без ручних перевизначень.

| Діапазон вхідних токенів | Тариф за вхід | Тариф за вивід | Читання кешу |
| ------------------------ | ------------- | -------------- | ------------ |
| 0 - 16,000               | 0.176         | 0.587          | 0.059        |
| 16,000 - 32,000          | 0.235         | 0.939          | 0.088        |
| 32,000+                  | 0.293         | 1.173          | 0.117        |

Тарифи наведено за мільйон токенів у доларах США, як заявлено Tencent. Перевизначайте ціни в `models.providers.tencent-tokenhub` лише тоді, коли вам потрібна інша поверхня.

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Перевизначення кінцевої точки">
    OpenClaw за замовчуванням використовує кінцеву точку Tencent Cloud `https://tokenhub.tencentmaas.com/v1`. Tencent також документує міжнародну кінцеву точку TokenHub:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
    ```

    Перевизначайте кінцеву точку лише тоді, коли цього вимагає ваш обліковий запис або регіон TokenHub.

  </Accordion>

  <Accordion title="Доступність середовища для демона">
    Якщо Gateway працює як керований сервіс (launchd, systemd, Docker), `TOKENHUB_API_KEY` має бути видимим для цього процесу. Задайте його в `~/.openclaw/.env` або через `env.shellEnv`, щоб середовища виконання launchd, systemd або Docker могли його прочитати.

    <Warning>
      Ключі, експортовані лише в інтерактивній оболонці, не видимі для керованих процесів Gateway. Використовуйте env-файл або конфігураційний шов для сталої доступності.
    </Warning>

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Постачальники моделей" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки перемикання після збою.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/configuration" icon="gear">
    Повна схема конфігурації, включно з налаштуваннями постачальників.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Сторінка продукту TokenHub від Tencent Cloud.
  </Card>
  <Card title="Картка моделі Hy3 preview" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Відомості та бенчмарки попередньої версії Tencent Hunyuan Hy3.
  </Card>
</CardGroup>
