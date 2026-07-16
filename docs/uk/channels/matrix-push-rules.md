---
read_when:
    - Налаштування тихої потокової передачі Matrix для самостійно розміщеного Synapse або Tuwunel
    - Користувачі хочуть отримувати сповіщення лише про завершені блоки, а не про кожне редагування попереднього перегляду
summary: Правила push-сповіщень Matrix для кожного одержувача щодо непомітних змін у завершеному попередньому перегляді
title: Правила push-сповіщень Matrix для ненав’язливого попереднього перегляду
x-i18n:
    generated_at: "2026-07-16T17:41:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1c58e7e796c3ae6d1ee25de229e4592ab8b4fb4d0d50a9cf868ab5ef35b1dab5
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

Коли `channels.matrix.streaming.mode` має значення `"quiet"`, OpenClaw передає відповідь потоково, редагуючи одну подію попереднього перегляду на місці. Попередні перегляди надсилаються як події `m.notice` без сповіщень, а завершене редагування позначається маркером `content["com.openclaw.finalized_preview"] = true`. Клієнти Matrix сповіщають про це остаточне редагування, лише якщо правило push-сповіщень для конкретного користувача відповідає маркеру. Ця сторінка призначена для операторів, які самостійно розміщують Matrix і хочуть установити це правило для кожного облікового запису одержувача.

`streaming.mode: "progress"` завершує свої чернетки тим самим шляхом, тому це правило також спрацьовує для завершених редагувань у режимі перебігу виконання.

Якщо потрібна лише стандартна поведінка сповіщень Matrix, використовуйте `streaming.mode: "partial"` або залиште потокове передавання вимкненим. Див. [налаштування каналу Matrix](/uk/channels/matrix#streaming-previews).

## Передумови

- користувач-одержувач = особа, яка має отримати сповіщення
- користувач-бот = обліковий запис OpenClaw у Matrix, який надсилає відповідь
- для наведених нижче викликів API використовуйте токен доступу користувача-одержувача
- зіставляйте `sender` у правилі push-сповіщень із повним MXID користувача-бота
- в обліковому записі одержувача вже мають працювати засоби push-доставки; правила тихого попереднього перегляду працюють лише за справної звичайної доставки push-сповіщень Matrix

## Кроки

<Steps>
  <Step title="Налаштуйте тихі попередні перегляди">

```json5
{
  channels: {
    matrix: {
      streaming: { mode: "quiet" },
    },
  },
}
```

  </Step>

  <Step title="Отримайте токен доступу одержувача">
    За можливості повторно використовуйте наявний токен клієнтського сеансу. Щоб створити новий:

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

  <Step title="Переконайтеся, що засоби push-доставки існують">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Якщо засоби push-доставки не повертаються, виправте звичайну доставку push-сповіщень Matrix для цього облікового запису, перш ніж продовжувати.

  </Step>

  <Step title="Установіть правило push-сповіщень із перевизначенням">
    Установіть правило, яке зіставляє маркер завершеного попереднього перегляду та MXID бота як відправника:

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

    Перед запуском замініть:

    - `https://matrix.example.org`: базову URL-адресу вашого домашнього сервера
    - `$USER_ACCESS_TOKEN`: токен доступу користувача-одержувача
    - `openclaw-finalized-preview-botname`: унікальний для кожного бота й одержувача ідентифікатор правила (шаблон: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: MXID вашого бота OpenClaw, а не одержувача

  </Step>

  <Step title="Перевірте">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Потім перевірте потокову відповідь. У тихому режимі в кімнаті відображається тихий попередній перегляд чернетки, а сповіщення надходить після завершення блоку або ходу.

  </Step>
</Steps>

Щоб пізніше видалити правило, виконайте `DELETE` для тієї самої URL-адреси правила з токеном одержувача.

## Примітки щодо кількох ботів

Правила push-сповіщень мають ключ `ruleId`: повторний запуск `PUT` для того самого ідентифікатора оновлює одне правило. Якщо кілька ботів OpenClaw сповіщають одного одержувача, створіть окреме правило для кожного бота з окремим зіставленням відправника.

Нові визначені користувачем правила `override` вставляються перед стандартними серверними правилами приглушення, тому додатковий параметр порядку не потрібен. Правило впливає лише на редагування текстових попередніх переглядів, які можна завершити на місці; відповіді з медіафайлами, резервні варіанти для застарілих попередніх переглядів і остаточні тексти, які активували б згадки Matrix, натомість доставляються як звичайні повідомлення зі сповіщенням.

## Примітки щодо домашнього сервера

<AccordionGroup>
  <Accordion title="Synapse">
    Спеціально змінювати `homeserver.yaml` не потрібно. Якщо звичайні сповіщення Matrix уже надходять цьому користувачеві, основним кроком налаштування є токен одержувача та наведений вище виклик `pushrules`.

    Якщо Synapse працює за зворотним проксі-сервером або з робочими процесами, переконайтеся, що `/_matrix/client/.../pushrules/` правильно надходить до Synapse. Push-доставку обробляє основний процес або `synapse.app.pusher` / налаштовані робочі процеси push-доставки — переконайтеся, що вони справні.

    Правило використовує умову правила push-сповіщень `event_property_is` (MSC3758, правило push-сповіщень v1.10), яку було додано до Synapse у 2023 році. Старіші випуски Synapse приймають виклик `PUT pushrules/...`, але непомітно ніколи не зіставляють умову — оновіть Synapse, якщо після завершеного редагування попереднього перегляду сповіщення не надходить.

  </Accordion>

  <Accordion title="Tuwunel">
    Процедура така сама, як для Synapse; для маркера завершеного попереднього перегляду не потрібна конфігурація, специфічна для Tuwunel.

    Якщо сповіщення зникають, коли користувач активний на іншому пристрої, перевірте, чи ввімкнено `suppress_push_when_active`. Tuwunel додав цю опцію у версії 1.4.2 (вересень 2025 року), і вона може навмисно приглушувати push-сповіщення на інших пристроях, поки один пристрій активний.

  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

- [Налаштування каналу Matrix](/uk/channels/matrix)
- [Концепції потокового передавання](/uk/concepts/streaming)
