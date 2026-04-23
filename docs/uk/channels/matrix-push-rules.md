---
read_when:
    - Налаштування тихого потокового передавання Matrix для self-hosted Synapse або Tuwunel
    - Користувачі хочуть отримувати сповіщення лише для завершених блоків, а не для кожного редагування попереднього перегляду
summary: Правила push Matrix для кожного отримувача для тихих завершених редагувань попереднього перегляду
title: Правила push Matrix для тихих попередніх переглядів
x-i18n:
    generated_at: "2026-04-23T20:44:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07a8cf9a4041b63e13feb21ee2eb22909cb14931d6929bedf6b94315f7a270cf
    source_path: channels/matrix-push-rules.md
    workflow: 15
---

Коли `channels.matrix.streaming` має значення `"quiet"`, OpenClaw редагує одну подію попереднього перегляду на місці й позначає завершене редагування користувацьким прапорцем вмісту. Клієнти Matrix сповіщають лише про фінальне редагування, якщо правило push для конкретного користувача відповідає цьому прапорцю. Ця сторінка призначена для операторів, які self-host Matrix і хочуть установити це правило для кожного облікового запису отримувача.

Якщо вам потрібна лише стандартна поведінка сповіщень Matrix, використовуйте `streaming: "partial"` або залиште потокове передавання вимкненим. Див. [налаштування каналу Matrix](/uk/channels/matrix#streaming-previews).

## Передумови

- recipient user = людина, яка має отримати сповіщення
- bot user = обліковий запис Matrix OpenClaw, який надсилає відповідь
- для наведених нижче викликів API використовуйте токен доступу користувача-отримувача
- у правилі push значення `sender` має збігатися з повним MXID користувача-бота
- обліковий запис отримувача вже має мати працездатні pusher-и — правила тихого попереднього перегляду працюють лише тоді, коли звичайна доставка push у Matrix працює коректно

## Кроки

<Steps>
  <Step title="Налаштуйте тихі попередні перегляди">

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

  </Step>

  <Step title="Отримайте токен доступу отримувача">
    За можливості повторно використайте токен наявної клієнтської сесії. Щоб створити новий:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": { "type": "m.id.user", "user": "@alice:example.org" },
    "password": "REDACTED"
  }'
```

  </Step>

  <Step title="Переконайтеся, що pusher-и існують">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Якщо жодних pusher-ів не повертається, спершу виправте звичайну доставку push у Matrix для цього облікового запису.

  </Step>

  <Step title="Установіть override-правило push">
    OpenClaw позначає завершені редагування текстового попереднього перегляду як `content["com.openclaw.finalized_preview"] = true`. Установіть правило, яке відповідає цьому маркеру, а також MXID бота як відправнику:

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

    Замініть перед запуском:

    - `https://matrix.example.org`: базова URL-адреса вашого homeserver
    - `$USER_ACCESS_TOKEN`: токен доступу користувача-отримувача
    - `openclaw-finalized-preview-botname`: ID правила, унікальний для кожного бота й отримувача (шаблон: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: MXID вашого бота OpenClaw, а не отримувача

  </Step>

  <Step title="Перевірте">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Потім протестуйте потокову відповідь. У тихому режимі кімната показує тихий чернетковий попередній перегляд і надсилає сповіщення один раз, коли блок або хід завершується.

  </Step>
</Steps>

Щоб пізніше видалити правило, виконайте `DELETE` для тієї самої URL-адреси правила з токеном отримувача.

## Нотатки щодо кількох ботів

Правила push визначаються за `ruleId`: повторний запуск `PUT` для того самого ID оновлює одне правило. Якщо кілька ботів OpenClaw сповіщають одного й того самого отримувача, створіть окреме правило для кожного бота з окремою відповідністю відправника.

Нові визначені користувачем правила `override` вставляються перед типовими правилами придушення, тому додатковий параметр порядку не потрібен. Правило впливає лише на редагування текстового попереднього перегляду, які можна завершити на місці; резервні варіанти для медіа та застарілих попередніх переглядів використовують звичайну доставку Matrix.

## Нотатки щодо homeserver

<AccordionGroup>
  <Accordion title="Synapse">
    Спеціальні зміни в `homeserver.yaml` не потрібні. Якщо звичайні сповіщення Matrix уже доходять до цього користувача, головним кроком налаштування є токен отримувача + виклик `pushrules`, наведений вище.

    Якщо ви запускаєте Synapse за reverse proxy або workers, переконайтеся, що `/_matrix/client/.../pushrules/` коректно потрапляє до Synapse. Доставку push обробляє головний процес або `synapse.app.pusher` / налаштовані pusher workers — переконайтеся, що вони працюють справно.

  </Accordion>

  <Accordion title="Tuwunel">
    Той самий процес, що й для Synapse; для маркера завершеного попереднього перегляду не потрібна конфігурація, специфічна для Tuwunel.

    Якщо сповіщення зникають, поки користувач активний на іншому пристрої, перевірте, чи ввімкнено `suppress_push_when_active`. Tuwunel додав цей параметр у версії 1.4.2 (вересень 2025), і він може навмисно придушувати push на інші пристрої, поки один пристрій активний.

  </Accordion>
</AccordionGroup>

## Пов’язане

- [налаштування каналу Matrix](/uk/channels/matrix)
- [Концепції потокового передавання](/uk/concepts/streaming)
