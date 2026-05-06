---
read_when:
    - Ви хочете використовувати попередню версію Tencent Hy3 з OpenClaw
    - Потрібно налаштувати API-ключ TokenHub
summary: Налаштування Tencent Cloud TokenHub для попередньої версії Hy3
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-05-06T00:38:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: a194e10b0e77e2567e6835f08d1cc0fa2a32fa8d37b1851fb83024b172a03fe3
    source_path: providers/tencent.md
    workflow: 16
---

Tencent Cloud постачається як вбудований Plugin постачальника в OpenClaw. Він надає доступ до Tencent Hy3 preview через кінцеву точку TokenHub (`tencent-tokenhub`) з використанням API, сумісного з OpenAI.

| Властивість      | Значення                                              |
| ---------------- | ----------------------------------------------------- |
| Ідентифікатор постачальника | `tencent-tokenhub`                                    |
| Plugin           | вбудований, `enabledByDefault: true`                  |
| Змінна середовища автентифікації | `TOKENHUB_API_KEY`                                    |
| Прапорець онбордингу | `--auth-choice tokenhub-api-key`                      |
| Прямий прапорець CLI | `--tokenhub-api-key <key>`                            |
| API              | сумісний з OpenAI (`openai-completions`)              |
| Базовий URL за замовчуванням | `https://tokenhub.tencentmaas.com/v1`                 |
| Глобальний базовий URL | `https://tokenhub-intl.tencentmaas.com/v1` (перевизначення) |
| Модель за замовчуванням | `tencent-tokenhub/hy3-preview`                        |

## Швидкий старт

<Steps>
  <Step title="Створіть API-ключ TokenHub">
    Створіть API-ключ у Tencent Cloud TokenHub. Якщо ви вибираєте обмежену область доступу для ключа, додайте **Hy3 preview** до дозволених моделей.
  </Step>
  <Step title="Запустіть онбординг">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice tokenhub-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash Env only
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

| Посилання на модель            | Назва                  | Вхідні дані | Контекст | Максимальний вихід | Примітки                  |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | -------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | text  | 256,000 | 64,000     | За замовчуванням; підтримує reasoning |

Hy3 preview — це велика MoE-мовна модель Tencent Hunyuan для reasoning, виконання інструкцій із довгим контекстом, коду та агентних робочих процесів. Приклади Tencent, сумісні з OpenAI, використовують `hy3-preview` як ідентифікатор моделі та підтримують стандартні chat-completions tool calling, а також `reasoning_effort`.

<Tip>
  Ідентифікатор моделі — `hy3-preview`. Не плутайте його з моделями Tencent `HY-3D-*`, які є API для 3D-генерації та не є чат-моделлю OpenClaw, налаштованою цим постачальником.
</Tip>

## Багаторівневе ціноутворення

Вбудований каталог постачається з багаторівневими метаданими вартості, що масштабуються залежно від довжини вхідного вікна, тому оцінки вартості заповнюються без ручних перевизначень.

| Діапазон вхідних токенів | Вхідний тариф | Вихідний тариф | Читання з кешу |
| ------------------ | ---------- | ----------- | ---------- |
| 0 - 16,000         | 0.176      | 0.587       | 0.059      |
| 16,000 - 32,000    | 0.235      | 0.939       | 0.088      |
| 32,000+            | 0.293      | 1.173       | 0.117      |

Тарифи наведено за мільйон токенів у доларах США, як заявляє Tencent. Перевизначайте ціни в `models.providers.tencent-tokenhub` лише тоді, коли вам потрібна інша поверхня.

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
    Якщо Gateway працює як керована служба (launchd, systemd, Docker), `TOKENHUB_API_KEY` має бути видимим для цього процесу. Задайте його в `~/.openclaw/.env` або через `env.shellEnv`, щоб середовища launchd, systemd або Docker exec могли його прочитати.

    <Warning>
      Ключі, задані лише в `~/.profile`, не видимі для керованих процесів Gateway. Для постійної доступності використовуйте файл середовища або конфігураційний seam.
    </Warning>

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Постачальники моделей" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/configuration" icon="gear">
    Повна схема конфігурації, включно з налаштуваннями постачальників.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Сторінка продукту TokenHub від Tencent Cloud.
  </Card>
  <Card title="Картка моделі Hy3 preview" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Відомості та бенчмарки Tencent Hunyuan Hy3 preview.
  </Card>
</CardGroup>
