---
read_when:
    - Ви хочете підключити OpenClaw до WeChat або Weixin
    - Ви встановлюєте Plugin каналу openclaw-weixin або усуваєте проблеми з ним
    - Потрібно розуміти, як зовнішні плагіни каналів працюють поруч із Gateway
summary: Налаштування каналу WeChat через зовнішній плагін openclaw-weixin
title: WeChat
x-i18n:
    generated_at: "2026-07-12T13:00:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98faf95f9fb76deedb7df9adf3092083722a77bdd793de98c41a6f715cc0d14a
    source_path: channels/wechat.md
    workflow: 16
---

OpenClaw підключається до WeChat через зовнішній Plugin каналу Tencent
`@tencent-weixin/openclaw-weixin`.

Статус: зовнішній Plugin, який підтримує команда Tencent Weixin. Підтримуються особисті чати та
медіафайли. Групові чати не заявлені в метаданих можливостей Plugin
(він декларує лише особисті чати).

## Назви

- **WeChat** — назва для користувачів у цій документації.
- **Weixin** — назва, яку використовує пакет Tencent та ідентифікатор Plugin.
- `openclaw-weixin` — ідентифікатор каналу OpenClaw (`weixin` і `wechat` працюють як псевдоніми).
- `@tencent-weixin/openclaw-weixin` — пакет npm.

Використовуйте `openclaw-weixin` у командах CLI та шляхах конфігурації.

## Як це працює

Код WeChat не міститься в основному репозиторії OpenClaw. OpenClaw надає
універсальний контракт Plugin каналу, а зовнішній Plugin забезпечує
середовище виконання, специфічне для WeChat:

1. `openclaw plugins install` установлює `@tencent-weixin/openclaw-weixin`.
2. Gateway виявляє маніфест Plugin і завантажує його точку входу.
3. Plugin реєструє ідентифікатор каналу `openclaw-weixin`.
4. `openclaw channels login --channel openclaw-weixin` запускає вхід за QR-кодом.
5. Plugin зберігає облікові дані облікового запису в каталозі стану OpenClaw
   (типово `~/.openclaw`).
6. Під час запуску Gateway Plugin запускає засіб моніторингу Weixin для кожного
   налаштованого облікового запису.
7. Вхідні повідомлення WeChat нормалізуються через контракт каналу, спрямовуються до
   вибраного агента OpenClaw і надсилаються у відповідь через вихідний шлях Plugin.

Це розмежування важливе: ядро OpenClaw залишається незалежним від конкретних каналів. Вхід у WeChat,
виклики API Tencent iLink, передавання та завантаження медіафайлів, токени контексту й
моніторинг облікових записів належать до відповідальності зовнішнього Plugin.

## Установлення

Швидке встановлення:

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

Ручне встановлення:

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

Після встановлення перезапустіть Gateway:

```bash
openclaw gateway restart
```

## Вхід

Запустіть вхід за QR-кодом на тому самому комп’ютері, де працює Gateway:

```bash
openclaw channels login --channel openclaw-weixin
```

Відскануйте QR-код за допомогою WeChat на телефоні та підтвердьте вхід. Після успішного
сканування Plugin зберігає токен облікового запису локально.

Щоб додати ще один обліковий запис WeChat, повторно виконайте ту саму команду входу. Для кількох
облікових записів ізолюйте сеанси особистих повідомлень за обліковим записом, каналом і відправником:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## Керування доступом

Для особистих повідомлень використовується стандартна модель сполучення та списку дозволених
відправників OpenClaw для Plugin каналів.

Схваліть нових відправників:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

Повний опис моделі керування доступом наведено в розділі [Сполучення](/uk/channels/pairing).

## Сумісність

Під час запуску Plugin перевіряє версію OpenClaw на хості.

| Лінійка Plugin | Версія OpenClaw                                                | Тег npm  |
| ----------- | --------------------------------------------------------------- | -------- |
| `2.x`       | `>=2026.5.12` (поточна 2.4.6; ранні версії 2.x приймали `>=2026.3.22`) | `latest` |
| `1.x`       | `>=2026.1.0 <2026.3.22`                                         | `legacy` |

Якщо Plugin повідомляє, що ваша версія OpenClaw застаріла, оновіть
OpenClaw або встановіть застарілу лінійку Plugin:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Допоміжний процес

Plugin WeChat може запускати допоміжні завдання поруч із Gateway під час моніторингу
API Tencent iLink. У проблемі №68451 цей допоміжний шлях виявив помилку в
універсальному очищенні застарілих процесів Gateway у OpenClaw: дочірній процес міг спробувати
завершити батьківський процес Gateway, спричиняючи цикли перезапуску під керуванням
менеджерів процесів, як-от systemd.

Поточне очищення під час запуску OpenClaw виключає поточний процес і його предків,
тому допоміжний процес каналу не може завершити Gateway, який його запустив. Це
універсальне виправлення, а не специфічний для WeChat шлях у ядрі.

## Усунення несправностей

Перевірте встановлення та стан:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

Якщо канал відображається як установлений, але не підключається, переконайтеся, що Plugin
увімкнено, і перезапустіть Gateway:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

Якщо після ввімкнення WeChat Gateway постійно перезапускається, оновіть OpenClaw і
Plugin:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

Якщо під час запуску повідомляється, що встановлений пакет Plugin `requires compiled runtime
output for TypeScript entry`, пакет npm було опубліковано без скомпільованих
файлів середовища виконання JavaScript, потрібних OpenClaw. Оновіть або перевстановіть Plugin після того, як
його видавець опублікує виправлений пакет, або тимчасово вимкніть чи видаліть Plugin.

Тимчасове вимкнення:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## Пов’язана документація

- Огляд каналів: [Канали чатів](/uk/channels)
- Сполучення: [Сполучення](/uk/channels/pairing)
- Маршрутизація каналів: [Маршрутизація каналів](/uk/channels/channel-routing)
- Архітектура Plugin: [Архітектура Plugin](/uk/plugins/architecture)
- SDK Plugin каналу: [SDK Plugin каналу](/uk/plugins/sdk-channel-plugins)
- Зовнішній пакет: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
