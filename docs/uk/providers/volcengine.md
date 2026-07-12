---
read_when:
    - Ви хочете використовувати моделі Volcano Engine або Doubao з OpenClaw
    - Вам потрібно налаштувати ключ API Volcengine
    - Ви хочете використовувати перетворення тексту на мовлення Volcengine Speech
summary: Налаштування Volcano Engine (моделі Doubao, кінцеві точки для програмування та TTS Seed Speech)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-07-12T13:44:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e853a1c8847704caedf0ec83c38332569f72105c5e34ad973daf614a2e80550b
    source_path: providers/volcengine.md
    workflow: 16
---

Провайдер Volcengine надає доступ до моделей Doubao та сторонніх моделей, розміщених у Volcano Engine, з окремими кінцевими точками для загальних завдань і програмування. Той самий вбудований Plugin також реєструє Volcengine Speech як провайдера TTS.

| Відомості          | Значення                                                   |
| ------------------ | ---------------------------------------------------------- |
| Провайдери         | `volcengine` (загальні моделі + TTS), `volcengine-plan` (програмування) |
| Автентифікація моделей | `VOLCANO_ENGINE_API_KEY`                               |
| Автентифікація TTS | `VOLCENGINE_TTS_API_KEY` або `BYTEPLUS_SEED_SPEECH_API_KEY` |
| API                | Сумісні з OpenAI моделі, BytePlus Seed Speech TTS          |

## Початок роботи

<Steps>
  <Step title="Установіть ключ API">
    Запустіть інтерактивне початкове налаштування:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Ця команда реєструє провайдери загального призначення (`volcengine`) і програмування (`volcengine-plan`) за допомогою одного ключа API.

  </Step>
  <Step title="Установіть модель за замовчуванням">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="Перевірте доступність моделі">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
Для неінтерактивного налаштування (CI, сценарії) передайте ключ безпосередньо:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Провайдери та кінцеві точки

| Провайдер         | Кінцева точка                             | Призначення          |
| ----------------- | ----------------------------------------- | -------------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Загальні моделі      |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Моделі для програмування |

<Note>
Обидва провайдери налаштовуються за допомогою одного ключа API. Під час налаштування вони реєструються автоматично, а засіб вибору моделей провайдера для програмування також повторно використовує автентифікацію загального провайдера (`volcengine-plan` є псевдонімом автентифікації для `volcengine`).
</Note>

## Вбудований каталог

<Tabs>
  <Tab title="Загальні моделі (volcengine)">
    | Посилання на модель                         | Назва                           | Вхідні дані      | Контекст |
    | ------------------------------------------- | ------------------------------- | ---------------- | -------- |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | текст, зображення | 128,000 |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | текст, зображення | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | текст, зображення | 256,000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | текст, зображення | 200,000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | текст, зображення | 256,000 |
  </Tab>
  <Tab title="Програмування (volcengine-plan)">
    | Посилання на модель                              | Назва                    | Вхідні дані | Контекст |
    | ------------------------------------------------ | ------------------------ | ----------- | -------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | текст       | 256,000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | текст       | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | текст       | 256,000 |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | текст       | 200,000 |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | текст       | 256,000 |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | текст       | 256,000 |
  </Tab>
</Tabs>

Обидва каталоги є статичними (без виклику виявлення `/models`) і підтримують потоковий облік використання, сумісний з OpenAI. Схеми інструментів для обох провайдерів автоматично вилучають ключові слова `minLength`, `maxLength`, `minItems`, `maxItems`, `minContains` і `maxContains`, оскільки API виклику інструментів Volcengine їх відхиляє.

## Синтез мовлення

Volcengine TTS використовує HTTP API BytePlus Seed Speech (`voice.ap-southeast-1.bytepluses.com`) і налаштовується окремо від ключа API моделей Doubao, сумісного з OpenAI. У консолі BytePlus відкрийте Seed Speech > Settings > API Keys, скопіюйте ключ API, а потім установіть:

```bash
export VOLCENGINE_TTS_API_KEY="byteplus_seed_speech_api_key"
export VOLCENGINE_TTS_RESOURCE_ID="seed-tts-1.0"
```

Після цього ввімкніть його в `openclaw.json`:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "byteplus_seed_speech_api_key",
          voice: "en_female_anna_mars_bigtts",
          speedRatio: 1.0,
        },
      },
    },
  },
}
```

Доступні поля в `messages.tts.providers.volcengine`: `apiKey`, `voice`, `speedRatio` (0.2–3.0), `emotion`, `cluster`, `resourceId`, `appKey` і `baseUrl`. `!emotion=<value>` також працює як вбудована директива голосу, коли дозволено перевизначати налаштування голосу.

Для цільових голосових повідомлень OpenClaw запитує нативний для провайдера формат `ogg_opus`. Для звичайних аудіовкладень запитується `mp3`. Псевдоніми провайдера `bytedance` і `doubao` також посилаються на цього провайдера синтезу мовлення.

Ідентифікатор ресурсу за замовчуванням — `seed-tts-1.0`, право доступу, яке BytePlus за замовчуванням надає новоствореним ключам API Seed Speech. Якщо ваш проєкт має право доступу до TTS 2.0, установіть `VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0`.

<Warning>
`VOLCANO_ENGINE_API_KEY` призначений для кінцевих точок моделей ModelArk/Doubao і не є ключем API Seed Speech. Для TTS потрібен ключ API Seed Speech із BytePlus Speech Console або застаріла пара AppID/токен зі Speech Console.
</Warning>

Автентифікація за допомогою застарілої пари AppID/токен залишається підтримуваною для старіших застосунків Speech Console:

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

Інші необов’язкові змінні середовища TTS: `VOLCENGINE_TTS_VOICE`, `VOLCENGINE_TTS_APP_KEY` і `VOLCENGINE_TTS_BASE_URL`; якщо їх установлено, вони перевизначають відповідні поля конфігурації `messages.tts.providers.volcengine`.

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Модель за замовчуванням після початкового налаштування">
    `openclaw onboard --auth-choice volcengine-api-key` установлює `volcengine-plan/ark-code-latest` як модель за замовчуванням і водночас реєструє загальний каталог `volcengine`.
  </Accordion>

  <Accordion title="Резервна поведінка засобу вибору моделей">
    Під час вибору моделі в процесі початкового або звичайного налаштування варіант автентифікації Volcengine надає перевагу рядкам `volcengine/*` і `volcengine-plan/*`. Якщо ці моделі ще не завантажено, OpenClaw використовує нефільтрований каталог замість відображення порожнього засобу вибору, обмеженого провайдером.
  </Accordion>

  <Accordion title="Змінні середовища для процесів-демонів">
    Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що змінні середовища моделей і TTS, як-от `VOLCANO_ENGINE_API_KEY`, `VOLCENGINE_TTS_API_KEY`, `BYTEPLUS_SEED_SPEECH_API_KEY`, `VOLCENGINE_TTS_APPID` і `VOLCENGINE_TTS_TOKEN`, доступні цьому процесу (наприклад, у `~/.openclaw/.env` або через `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
Коли OpenClaw працює як фонова служба, змінні середовища, установлені в інтерактивній оболонці, не успадковуються автоматично. Дивіться примітку про демон вище.
</Warning>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки аварійного перемикання.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник із конфігурації агентів, моделей і провайдерів.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Поширені проблеми та кроки налагодження.
  </Card>
  <Card title="Поширені запитання" href="/uk/help/faq" icon="circle-question">
    Поширені запитання про налаштування OpenClaw.
  </Card>
</CardGroup>
