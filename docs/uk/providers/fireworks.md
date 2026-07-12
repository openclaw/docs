---
read_when:
    - Ви хочете використовувати Fireworks з OpenClaw
    - Вам потрібна змінна середовища для ключа API Fireworks або ідентифікатор моделі за замовчуванням
    - Ви налагоджуєте поведінку Kimi з вимкненим режимом міркування у Fireworks
summary: Налаштування Fireworks (автентифікація + вибір моделі)
title: Феєрверки
x-i18n:
    generated_at: "2026-07-12T13:41:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15feed0730ec65d943f103824468490be6616478ece80bedfeb9ad8137506180
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) надає моделі з відкритими вагами та маршрутизовані моделі через API, сумісний з OpenAI. Установіть офіційний Plugin постачальника Fireworks, щоб використовувати дві попередньо додані до каталогу моделі Kimi та будь-яку модель або ідентифікатор маршрутизатора Fireworks під час виконання.

| Властивість                   | Значення                                               |
| ----------------------------- | ------------------------------------------------------ |
| Ідентифікатор постачальника   | `fireworks` (псевдонім: `fireworks-ai`)                |
| Пакет                         | `@openclaw/fireworks-provider`                         |
| Змінна середовища автентифікації | `FIREWORKS_API_KEY`                                 |
| Прапорець початкового налаштування | `--auth-choice fireworks-api-key`                  |
| Прямий прапорець CLI          | `--fireworks-api-key <key>`                            |
| API                           | Сумісний з OpenAI (`openai-completions`)               |
| Базова URL-адреса             | `https://api.fireworks.ai/inference/v1`                |
| Модель за замовчуванням       | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| Псевдонім за замовчуванням    | `Kimi K2.5 Turbo`                                      |

## Початок роботи

<Steps>
  <Step title="Установіть Plugin">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="Задайте ключ API Fireworks">
    <CodeGroup>

```bash Початкове налаштування
openclaw onboard --auth-choice fireworks-api-key
```

```bash Прямий прапорець
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash Лише змінна середовища
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    Під час початкового налаштування ключ зберігається для постачальника `fireworks` у ваших профілях автентифікації, а маршрутизатор Kimi K2.5 Turbo **Fire Pass** установлюється як модель за замовчуванням.

  </Step>
  <Step title="Перевірте доступність моделі">
    ```bash
    openclaw models list --provider fireworks
    ```

    Список має містити `Kimi K2.6` і `Kimi K2.5 Turbo (Fire Pass)`. Якщо `FIREWORKS_API_KEY` не визначено, `openclaw models status --json` повідомляє про відсутні облікові дані в `auth.unusableProfiles`.

  </Step>
</Steps>

## Неінтерактивне налаштування

Для сценарних установлень або встановлень у CI передайте всі параметри в командному рядку:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Вбудований каталог

| Посилання на модель                                   | Назва                       | Вхідні дані       | Контекст | Макс. вивід | Міркування                       |
| ----------------------------------------------------- | --------------------------- | ----------------- | -------- | ----------- | -------------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | текст + зображення | 262,144  | 262,144     | Примусово вимкнено                |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | текст + зображення | 256,000  | 256,000     | Примусово вимкнено (за замовчуванням) |

<Note>
  OpenClaw фіксує для всіх моделей Kimi у Fireworks значення `thinking: off`, оскільки Kimi у Fireworks може показувати ланцюжок міркувань у видимій відповіді, якщо запит явно не вимикає міркування. Маршрутизація тієї самої моделі безпосередньо через [Moonshot](/uk/providers/moonshot) зберігає вивід міркувань Kimi. Відомості про перемикання між постачальниками див. у розділі [режими міркування](/uk/tools/thinking).
</Note>

## Власні ідентифікатори моделей Fireworks

OpenClaw приймає під час виконання будь-який ідентифікатор моделі або маршрутизатора Fireworks. Використовуйте точний ідентифікатор, показаний у Fireworks, із префіксом `fireworks/`. Динамічне визначення копіює шаблон Fire Pass (вхідні дані у вигляді тексту й зображень, сумісний з OpenAI API, нульова вартість за замовчуванням) та автоматично вимикає міркування, якщо ідентифікатор відповідає шаблону Kimi. Динамічні ідентифікатори GLM позначаються як такі, що підтримують лише текст, якщо ви не налаштуєте власний запис моделі з підтримкою зображень у вхідних даних.

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
  <Accordion title="Як працює додавання префікса до ідентифікатора моделі">
    Кожне посилання на модель Fireworks в OpenClaw починається з `fireworks/`, після якого вказано точний ідентифікатор або шлях маршрутизатора з платформи Fireworks. Наприклад:

    - Модель маршрутизатора: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Пряма модель: `fireworks/accounts/fireworks/models/<model-name>`

    Під час формування запиту API OpenClaw вилучає префікс `fireworks/` і надсилає решту шляху до кінцевої точки Fireworks як сумісне з OpenAI поле `model`.

  </Accordion>

  <Accordion title="Чому міркування для Kimi примусово вимкнено">
    Fireworks надає Kimi без окремого каналу міркувань, тому ланцюжок міркувань може з’явитися у видимому потоці `content`. У кожному запиті Kimi до Fireworks OpenClaw надсилає `thinking: { type: "disabled" }` і вилучає `reasoning`, `reasoning_effort` та `reasoningEffort` із корисного навантаження (`extensions/fireworks/stream.ts`). Політика постачальника (`extensions/fireworks/thinking-policy.ts`) оголошує для ідентифікаторів моделей Kimi лише рівень міркування `off`, тому ручні перемикання `/think` і поверхні політики постачальника залишаються узгодженими з контрактом середовища виконання.

    Щоб використовувати міркування Kimi наскрізно, налаштуйте [постачальника Moonshot](/uk/providers/moonshot) і маршрутизуйте ту саму модель через нього.

  </Accordion>

  <Accordion title="Доступність середовища для фонової служби">
    Якщо Gateway працює як керована служба (launchd, systemd, Docker), ключ Fireworks має бути доступним цьому процесу, а не лише вашій інтерактивній оболонці.

    <Warning>
      Ключ, експортований лише в інтерактивній оболонці, не допоможе фоновій службі launchd або systemd, якщо це середовище також не імпортовано до неї. Задайте ключ у `~/.openclaw/.env` або через `env.shellEnv`, щоб процес Gateway міг його прочитати.
    </Warning>

    OpenClaw завантажує `~/.openclaw/.env` під час завантаження конфігурації, тому збережені там ключі доступні керованим службам Gateway на кожній платформі. Після заміни ключа перезапустіть Gateway (або знову виконайте `openclaw doctor --fix`).

  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Постачальники моделей" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки резервного перемикання.
  </Card>
  <Card title="Режими міркування" href="/uk/tools/thinking" icon="brain">
    Рівні `/think`, політики постачальників і маршрутизація моделей із підтримкою міркувань.
  </Card>
  <Card title="Moonshot" href="/uk/providers/moonshot" icon="moon">
    Запускайте Kimi з нативним виводом міркувань через власний API Moonshot.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Загальні рекомендації з усунення несправностей і поширені запитання.
  </Card>
</CardGroup>
