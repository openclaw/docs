---
read_when:
    - Ви хочете використовувати Volcano Engine або моделі Doubao з OpenClaw
    - Вам потрібно налаштувати ключ API Volcengine
    - Ви хочете використовувати перетворення тексту на мовлення Volcengine Speech
summary: Налаштування Volcano Engine (моделі Doubao, кінцеві точки для кодування та Seed Speech TTS)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-25T22:53:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7948a26cc898e125d445e9ae091704f5cf442266d29e712c0dcedbe0dc0cce7
    source_path: providers/volcengine.md
    workflow: 15
    postprocess_version: locale-links-v1
---

Постачальник Volcengine надає доступ до моделей Doubao і сторонніх моделей,
розміщених на Volcano Engine, з окремими кінцевими точками для загальних і
пов’язаних із кодуванням навантажень. Той самий вбудований Plugin також може
зареєструвати Volcengine Speech як постачальника TTS.

| Деталь     | Значення                                                   |
| ---------- | ---------------------------------------------------------- |
| Постачальники | `volcengine` (загальний + TTS) + `volcengine-plan` (кодування) |
| Автентифікація моделі | `VOLCANO_ENGINE_API_KEY`                                   |
| Автентифікація TTS   | `VOLCENGINE_TTS_API_KEY` or `BYTEPLUS_SEED_SPEECH_API_KEY` |
| API        | OpenAI-сумісні моделі, BytePlus Seed Speech TTS           |

## Початок роботи

<Steps>
  <Step title="Установіть ключ API">
    Запустіть інтерактивне онбординг-налаштування:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Це реєструє як загального (`volcengine`), так і постачальника для кодування (`volcengine-plan`) за одним ключем API.

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
  <Step title="Переконайтеся, що модель доступна">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
Для неінтерактивного налаштування (CI, сценарії) передайте ключ напряму:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Постачальники та кінцеві точки

| Постачальник      | Кінцева точка                            | Випадок використання |
| ----------------- | ---------------------------------------- | -------------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`       | Загальні моделі      |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Моделі для кодування |

<Note>
Обидва постачальники налаштовуються за одним ключем API. Під час налаштування обидва реєструються автоматично.
</Note>

## Вбудований каталог

<Tabs>
  <Tab title="Загальні (volcengine)">
    | Model ref                                    | Назва                           | Вхід        | Контекст |
    | -------------------------------------------- | ------------------------------- | ----------- | -------- |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | text, image | 256,000  |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | text, image | 256,000  |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | text, image | 256,000  |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | text, image | 200,000  |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | text, image | 128,000  |
  </Tab>
  <Tab title="Кодування (volcengine-plan)">
    | Model ref                                         | Назва                    | Вхід | Контекст |
    | ------------------------------------------------- | ------------------------ | ---- | -------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | text | 256,000  |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | text | 256,000  |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | text | 200,000  |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | text | 256,000  |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | text | 256,000  |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | text | 256,000  |
  </Tab>
</Tabs>

## Перетворення тексту на мовлення

Volcengine TTS використовує HTTP API BytePlus Seed Speech і налаштовується
окремо від OpenAI-сумісного ключа API моделі Doubao. У консолі BytePlus
відкрийте Seed Speech > Settings > API Keys і скопіюйте ключ API, а потім задайте:

```bash
export VOLCENGINE_TTS_API_KEY="byteplus_seed_speech_api_key"
export VOLCENGINE_TTS_RESOURCE_ID="seed-tts-1.0"
```

Потім увімкніть його в `openclaw.json`:

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

Для цілей голосових нотаток OpenClaw запитує у Volcengine рідний для
постачальника формат `ogg_opus`. Для звичайних аудіовкладень він запитує `mp3`.
Псевдоніми постачальника `bytedance` і `doubao` також вказують на того самого постачальника мовлення.

Ресурсний ідентифікатор за замовчуванням — `seed-tts-1.0`, тому що саме його BytePlus надає
новоствореним ключам API Seed Speech у проєкті за замовчуванням. Якщо ваш проєкт
має entitlement на TTS 2.0, установіть `VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0`.

<Warning>
`VOLCANO_ENGINE_API_KEY` призначений для кінцевих точок моделей ModelArk/Doubao і не є
ключем API Seed Speech. Для TTS потрібен ключ API Seed Speech з BytePlus Speech
Console або застаріла пара AppID/токен зі Speech Console.
</Warning>

Застаріла автентифікація AppID/токеном і далі підтримується для старих застосунків Speech Console:

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

## Розширене налаштування

<AccordionGroup>
  <Accordion title="Модель за замовчуванням після онбординг-налаштування">
    `openclaw onboard --auth-choice volcengine-api-key` наразі встановлює
    `volcengine-plan/ark-code-latest` як модель за замовчуванням, одночасно реєструючи
    загальний каталог `volcengine`.
  </Accordion>

  <Accordion title="Поведінка резервного варіанта для вибору моделі">
    Під час онбординг-налаштування/налаштування вибору моделі варіант автентифікації Volcengine надає перевагу
    рядкам `volcengine/*` і `volcengine-plan/*`. Якщо ці моделі ще не
    завантажені, OpenClaw повертається до нефільтрованого каталогу замість показу
    порожнього засобу вибору в межах постачальника.
  </Accordion>

  <Accordion title="Змінні середовища для процесів демона">
    Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що змінні
    середовища для моделі й TTS, такі як `VOLCANO_ENGINE_API_KEY`, `VOLCENGINE_TTS_API_KEY`,
    `BYTEPLUS_SEED_SPEECH_API_KEY`, `VOLCENGINE_TTS_APPID` і
    `VOLCENGINE_TTS_TOKEN`, доступні цьому процесу (наприклад, у
    `~/.openclaw/.env` або через `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
Коли OpenClaw працює як фоновий сервіс, змінні середовища, задані у вашій
інтерактивній оболонці, не успадковуються автоматично. Див. примітку про демона вище.
</Warning>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки резервного перемикання.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник із конфігурації для агентів, моделей і постачальників.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Поширені проблеми та кроки налагодження.
  </Card>
  <Card title="FAQ" href="/uk/help/faq" icon="circle-question">
    Поширені запитання щодо налаштування OpenClaw.
  </Card>
</CardGroup>
