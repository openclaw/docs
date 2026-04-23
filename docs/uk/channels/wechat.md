---
read_when:
    - Ви хочете підключити OpenClaw до WeChat або Weixin
    - Ви встановлюєте або усуваєте несправності Plugin каналу openclaw-weixin
    - Вам потрібно зрозуміти, як зовнішні Plugin каналів працюють поруч із Gateway
summary: Налаштування каналу WeChat через зовнішній Plugin openclaw-weixin
title: WeChat
x-i18n:
    generated_at: "2026-04-23T20:45:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: ea7c815a364c2ae087041bf6de5b4182334c67377e18b9bedfa0f9d949afc09c
    source_path: channels/wechat.md
    workflow: 15
---

OpenClaw підключається до WeChat через зовнішній Plugin каналу Tencent
`@tencent-weixin/openclaw-weixin`.

Статус: зовнішній Plugin. Підтримуються direct chats і медіа. Group chats не
заявлені в поточних метаданих можливостей Plugin.

## Назви

- **WeChat** — користувацька назва в цій документації.
- **Weixin** — назва, яку використовує пакет Tencent і id Plugin.
- `openclaw-weixin` — id каналу OpenClaw.
- `@tencent-weixin/openclaw-weixin` — пакет npm.

Використовуйте `openclaw-weixin` у командах CLI і шляхах конфігурації.

## Як це працює

Код WeChat не знаходиться в основному репозиторії OpenClaw. OpenClaw надає
загальний контракт Plugin каналу, а зовнішній Plugin надає
специфічне для WeChat середовище виконання:

1. `openclaw plugins install` встановлює `@tencent-weixin/openclaw-weixin`.
2. Gateway виявляє маніфест Plugin і завантажує entrypoint Plugin.
3. Plugin реєструє id каналу `openclaw-weixin`.
4. `openclaw channels login --channel openclaw-weixin` запускає вхід через QR.
5. Plugin зберігає облікові дані облікового запису в каталозі стану OpenClaw.
6. Коли Gateway запускається, Plugin запускає свій монітор Weixin для кожного
   налаштованого облікового запису.
7. Вхідні повідомлення WeChat нормалізуються через контракт каналу, маршрутизуються до
   вибраного агента OpenClaw і надсилаються назад через вихідний шлях Plugin.

Це розділення важливе: ядро OpenClaw має залишатися незалежним від каналів. Вхід у WeChat,
виклики API Tencent iLink, вивантаження/завантаження медіа, токени контексту й
моніторинг облікових записів належать зовнішньому Plugin.

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

Запустіть вхід через QR на тій самій машині, де працює Gateway:

```bash
openclaw channels login --channel openclaw-weixin
```

Відскануйте QR-код у WeChat на телефоні та підтвердьте вхід. Після успішного сканування Plugin зберігає
токен облікового запису локально.

Щоб додати ще один обліковий запис WeChat, знову виконайте ту саму команду входу. Для кількох
облікових записів ізолюйте сесії direct messages за обліковим записом, каналом і відправником:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## Керування доступом

Для direct messages використовується звичайна модель pairing та allowlist OpenClaw для
Plugin каналів.

Схваліть нових відправників:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

Повну модель керування доступом див. у [Pairing](/uk/channels/pairing).

## Сумісність

Plugin перевіряє версію хостового OpenClaw під час запуску.

| Лінійка Plugin | Версія OpenClaw         | npm tag  |
| -------------- | ----------------------- | -------- |
| `2.x`          | `>=2026.3.22`           | `latest` |
| `1.x`          | `>=2026.1.0 <2026.3.22` | `legacy` |

Якщо Plugin повідомляє, що ваша версія OpenClaw занадто стара, або оновіть
OpenClaw, або встановіть лінійку застарілого Plugin:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Sidecar-процес

Plugin WeChat може запускати допоміжну роботу поруч із Gateway, поки він моніторить
API Tencent iLink. У проблемі #68451 цей допоміжний шлях виявив баг в
загальному очищенні застарілого Gateway в OpenClaw:
дочірній процес міг спробувати очистити батьківський процес Gateway, спричиняючи цикли перезапуску в менеджерах процесів, таких як systemd.

Поточне очищення під час запуску OpenClaw виключає поточний процес і його предків,
тому допоміжний процес каналу не повинен завершувати Gateway, який його запустив. Це
загальне виправлення; це не специфічний для WeChat шлях у ядрі.

## Усунення несправностей

Перевірте встановлення і стан:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

Якщо канал показується як встановлений, але не підключається, переконайтеся, що Plugin
увімкнений, і перезапустіть:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

Якщо Gateway неодноразово перезапускається після ввімкнення WeChat, оновіть і OpenClaw, і
Plugin:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

Тимчасове вимкнення:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## Пов’язана документація

- Огляд каналів: [Chat Channels](/uk/channels)
- Pairing: [Pairing](/uk/channels/pairing)
- Маршрутизація каналів: [Channel Routing](/uk/channels/channel-routing)
- Архітектура Plugin: [Plugin Architecture](/uk/plugins/architecture)
- SDK Plugin каналів: [Channel Plugin SDK](/uk/plugins/sdk-channel-plugins)
- Зовнішній пакет: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
