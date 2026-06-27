---
read_when:
    - Ви хочете використовувати Fireworks з OpenClaw
    - Вам потрібна змінна середовища ключа Fireworks API або ідентифікатор моделі за замовчуванням
    - Ви налагоджуєте поведінку Kimi з вимкненим thinking у Fireworks
summary: Налаштування Fireworks (автентифікація + вибір моделі)
title: Феєрверки
x-i18n:
    generated_at: "2026-06-27T18:10:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7413ec9ea192921ce9b9ec51da5b0b9ff1030feeef192afbefc938ed200e192e
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) надає open-weight і маршрутизовані моделі через API, сумісний з OpenAI. Установіть офіційний provider Plugin Fireworks, щоб використовувати дві попередньо каталогізовані моделі Kimi та будь-яку модель або router id Fireworks під час виконання.

| Властивість       | Значення                                               |
| ----------------- | ------------------------------------------------------ |
| Provider id       | `fireworks` (псевдонім: `fireworks-ai`)                |
| Пакет             | `@openclaw/fireworks-provider`                         |
| Auth env var      | `FIREWORKS_API_KEY`                                    |
| Прапорець онбордингу | `--auth-choice fireworks-api-key`                   |
| Прямий прапорець CLI | `--fireworks-api-key <key>`                         |
| API               | сумісний з OpenAI (`openai-completions`)               |
| Base URL          | `https://api.fireworks.ai/inference/v1`                |
| Модель за замовчуванням | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| Псевдонім за замовчуванням | `Kimi K2.5 Turbo`                              |

## Початок роботи

<Steps>
  <Step title="Установіть Plugin">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="Задайте API-ключ Fireworks">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice fireworks-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash Env only
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    Онбординг зберігає ключ для provider `fireworks` у ваших профілях автентифікації та встановлює router **Fire Pass** Kimi K2.5 Turbo як модель за замовчуванням.

  </Step>
  <Step title="Перевірте, що модель доступна">
    ```bash
    openclaw models list --provider fireworks
    ```

    Список має містити `Kimi K2.6` і `Kimi K2.5 Turbo (Fire Pass)`. Якщо `FIREWORKS_API_KEY` не розв’язано, `openclaw models status --json` повідомляє про відсутні облікові дані в `auth.unusableProfiles`.

  </Step>
</Steps>

## Неінтерактивне налаштування

Для скриптових або CI-установлень передайте все в командному рядку:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Вбудований каталог

| Model ref                                              | Назва                       | Ввід         | Контекст | Макс. вивід | Thinking             |
| ------------------------------------------------------ | --------------------------- | ------------ | -------- | ----------- | -------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | текст + зображення | 262,144 | 262,144     | Примусово вимкнено   |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | текст + зображення | 256,000 | 256,000     | Примусово вимкнено (за замовчуванням) |

<Note>
  OpenClaw закріплює всі моделі Kimi Fireworks за `thinking: off`, оскільки Fireworks відхиляє параметри thinking Kimi у production. Маршрутизація тієї самої моделі напряму через [Moonshot](/uk/providers/moonshot) зберігає вивід reasoning Kimi. Дивіться [режими thinking](/uk/tools/thinking), щоб перемикатися між providers.
</Note>

## Власні id моделей Fireworks

OpenClaw приймає будь-яку модель або router id Fireworks під час виконання. Використовуйте точний id, показаний Fireworks, і додайте до нього префікс `fireworks/`. Динамічне розв’язання клонує шаблон Fire Pass (ввід тексту + зображення, API, сумісний з OpenAI, вартість за замовчуванням нуль) і автоматично вимикає thinking, коли id відповідає шаблону Kimi. Динамічні id GLM позначаються як текстові, якщо ви не налаштуєте власний запис моделі з вводом зображень.

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
  <Accordion title="Як працює додавання префікса до model id">
    Кожен model ref Fireworks в OpenClaw починається з `fireworks/`, після якого йде точний id або шлях router з платформи Fireworks. Наприклад:

    - Модель router: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Пряма модель: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw відкидає префікс `fireworks/` під час створення API-запиту та надсилає решту шляху до endpoint Fireworks як сумісне з OpenAI поле `model`.

  </Accordion>

  <Accordion title="Чому thinking для Kimi примусово вимкнено">
    Fireworks K2.6 повертає 400, якщо запит містить параметри `reasoning_*`, хоча Kimi підтримує thinking через власний API Moonshot. Політика provider (`extensions/fireworks/thinking-policy.ts`) оголошує для id моделей Kimi лише рівень thinking `off`, тож ручні перемикачі `/think` і поверхні provider-policy залишаються узгодженими з контрактом runtime.

    Щоб використовувати reasoning Kimi наскрізно, налаштуйте [provider Moonshot](/uk/providers/moonshot) і маршрутизуйте ту саму модель через нього.

  </Accordion>

  <Accordion title="Доступність середовища для daemon">
    Якщо Gateway працює як керований сервіс (launchd, systemd, Docker), ключ Fireworks має бути видимий цьому процесу — не лише вашій інтерактивній оболонці.

    <Warning>
      Ключ, експортований лише в інтерактивній оболонці, не допоможе daemon launchd або systemd, якщо це середовище також не імпортовано туди. Задайте ключ у `~/.openclaw/.env` або через `env.shellEnv`, щоб процес gateway міг його прочитати.
    </Warning>

    У macOS `openclaw gateway install` уже під’єднує `~/.openclaw/.env` до файла середовища LaunchAgent. Повторно запустіть install (або `openclaw doctor --fix`) після ротації ключа.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Providers моделей" href="/uk/concepts/model-providers" icon="layers">
    Вибір providers, model refs і поведінки failover.
  </Card>
  <Card title="Режими thinking" href="/uk/tools/thinking" icon="brain">
    Рівні `/think`, політики provider і маршрутизація моделей із підтримкою reasoning.
  </Card>
  <Card title="Moonshot" href="/uk/providers/moonshot" icon="moon">
    Запускайте Kimi з нативним виводом thinking через власний API Moonshot.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Загальне усунення несправностей і FAQ.
  </Card>
</CardGroup>
