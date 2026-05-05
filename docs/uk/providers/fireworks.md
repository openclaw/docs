---
read_when:
    - Ви хочете використовувати Fireworks з OpenClaw
    - Потрібна змінна середовища з API-ключем Fireworks або ідентифікатор моделі за замовчуванням
    - Ви налагоджуєте поведінку Kimi з вимкненим режимом мислення у Fireworks
summary: Налаштування Fireworks (автентифікація + вибір моделі)
title: Феєрверки
x-i18n:
    generated_at: "2026-05-05T23:46:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a7dcaf6c7e1c004436213e67bc2262992ee1307cdaa5c290225345782f4cbfa
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) надає моделі з відкритими вагами та маршрутизовані моделі через API, сумісний з OpenAI. OpenClaw містить вбудований Plugin постачальника Fireworks, який постачається з двома попередньо каталогізованими моделями Kimi та приймає будь-яку модель або ідентифікатор маршрутизатора Fireworks під час виконання.

| Властивість     | Значення                                               |
| --------------- | ------------------------------------------------------ |
| Ідентифікатор постачальника | `fireworks` (псевдонім: `fireworks-ai`)   |
| Plugin          | вбудований, `enabledByDefault: true`                   |
| Змінна середовища автентифікації | `FIREWORKS_API_KEY`                  |
| Прапорець онбордингу | `--auth-choice fireworks-api-key`                  |
| Прямий прапорець CLI | `--fireworks-api-key <key>`                        |
| API             | сумісний з OpenAI (`openai-completions`)               |
| Базова URL-адреса | `https://api.fireworks.ai/inference/v1`              |
| Модель за замовчуванням | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| Псевдонім за замовчуванням | `Kimi K2.5 Turbo`                              |

## Початок роботи

<Steps>
  <Step title="Задайте API-ключ Fireworks">
    <CodeGroup>

```bash Онбординг
openclaw onboard --auth-choice fireworks-api-key
```

```bash Прямий прапорець
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash Лише середовище
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    Онбординг зберігає ключ для постачальника `fireworks` у ваших профілях автентифікації та задає маршрутизатор **Fire Pass** Kimi K2.5 Turbo як модель за замовчуванням.

  </Step>
  <Step title="Перевірте, що модель доступна">
    ```bash
    openclaw models list --provider fireworks
    ```

    Список має містити `Kimi K2.6` і `Kimi K2.5 Turbo (Fire Pass)`. Якщо `FIREWORKS_API_KEY` не розв’язано, `openclaw models status --json` повідомляє про відсутні облікові дані в `auth.unusableProfiles`.

  </Step>
</Steps>

## Неінтерактивне налаштування

Для скриптових або CI-встановлень передайте все в командному рядку:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Вбудований каталог

| Посилання на модель                                      | Назва                       | Вхідні дані  | Контекст | Максимальний вивід | Мислення             |
| ------------------------------------------------------ | --------------------------- | ------------ | ------- | ---------- | -------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | текст + зображення | 262,144 | 262,144    | Примусово вимкнено   |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | текст + зображення | 256,000 | 256,000    | Примусово вимкнено (за замовчуванням) |

<Note>
  OpenClaw закріплює всі моделі Kimi у Fireworks на `thinking: off`, оскільки Fireworks відхиляє параметри мислення Kimi у production. Маршрутизація тієї самої моделі безпосередньо через [Moonshot](/uk/providers/moonshot) зберігає вивід міркування Kimi. Див. [режими мислення](/uk/tools/thinking), щоб перемикатися між постачальниками.
</Note>

## Власні ідентифікатори моделей Fireworks

OpenClaw приймає будь-яку модель або ідентифікатор маршрутизатора Fireworks під час виконання. Використовуйте точний ідентифікатор, показаний Fireworks, і додайте до нього префікс `fireworks/`. Динамічне розв’язання клонує шаблон Fire Pass (введення тексту + зображення, API, сумісний з OpenAI, вартість за замовчуванням нульова) і автоматично вимикає мислення, коли ідентифікатор відповідає шаблону Kimi.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/models/<your-model-id>",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Як працює префіксування ідентифікаторів моделей">
    Кожне посилання на модель Fireworks в OpenClaw починається з `fireworks/`, після якого йде точний ідентифікатор або шлях маршрутизатора з платформи Fireworks. Наприклад:

    - Модель маршрутизатора: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Пряма модель: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw прибирає префікс `fireworks/` під час створення API-запиту та надсилає решту шляху до кінцевої точки Fireworks як сумісне з OpenAI поле `model`.

  </Accordion>

  <Accordion title="Чому мислення для Kimi примусово вимкнене">
    Fireworks K2.6 повертає 400, якщо запит містить параметри `reasoning_*`, хоча Kimi підтримує мислення через власний API Moonshot. Вбудована політика (`extensions/fireworks/thinking-policy.ts`) оголошує для ідентифікаторів моделей Kimi лише рівень мислення `off`, тому ручні перемикачі `/think` і поверхні політик постачальника залишаються узгодженими з контрактом часу виконання.

    Щоб використовувати міркування Kimi повністю від початку до кінця, налаштуйте [постачальника Moonshot](/uk/providers/moonshot) і маршрутизуйте ту саму модель через нього.

  </Accordion>

  <Accordion title="Доступність середовища для демона">
    Якщо Gateway працює як керована служба (launchd, systemd, Docker), ключ Fireworks має бути видимим для цього процесу, а не лише для вашої інтерактивної оболонки.

    <Warning>
      Ключ, який є лише в `~/.profile`, не допоможе демону launchd або systemd, якщо це середовище також не імпортовано туди. Задайте ключ у `~/.openclaw/.env` або через `env.shellEnv`, щоб зробити його доступним для читання з процесу Gateway.
    </Warning>

    На macOS `openclaw gateway install` вже під’єднує `~/.openclaw/.env` до файла середовища LaunchAgent. Після ротації ключа повторно запустіть встановлення (або `openclaw doctor --fix`).

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Постачальники моделей" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки відмовостійкого перемикання.
  </Card>
  <Card title="Режими мислення" href="/uk/tools/thinking" icon="brain">
    Рівні `/think`, політики постачальників і маршрутизація моделей, здатних до міркування.
  </Card>
  <Card title="Moonshot" href="/uk/providers/moonshot" icon="moon">
    Запускайте Kimi з нативним виводом мислення через власний API Moonshot.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Загальне усунення несправностей і поширені запитання.
  </Card>
</CardGroup>
