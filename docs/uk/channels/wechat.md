---
read_when:
    - Ви хочете підключити OpenClaw до WeChat або Weixin
    - Ви встановлюєте або усуваєте проблеми Plugin каналу openclaw-weixin
    - Потрібно розуміти, як зовнішні плагіни каналів працюють поруч із Gateway
summary: Налаштування каналу WeChat через зовнішній Plugin openclaw-weixin
title: WeChat
x-i18n:
    generated_at: "2026-05-06T00:47:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 803557a4fc92056c63053a3388100a451b2d85d4e892877707b3c2e3a677c0b0
    source_path: channels/wechat.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw підключається до WeChat через зовнішній канальний Plugin Tencent
`@tencent-weixin/openclaw-weixin`.

Статус: зовнішній Plugin. Прямі чати й медіа підтримуються. Групові чати не
заявлені поточними метаданими можливостей Plugin.

## Назви

- **WeChat** — назва для користувачів у цій документації.
- **Weixin** — назва, яку використовує пакет Tencent і id Plugin.
- `openclaw-weixin` — id каналу OpenClaw.
- `@tencent-weixin/openclaw-weixin` — npm-пакет.

Використовуйте `openclaw-weixin` у командах CLI і шляхах конфігурації.

## Як це працює

Код WeChat не міститься в основному репозиторії OpenClaw. OpenClaw надає
загальний контракт канального Plugin, а зовнішній Plugin надає специфічне для
WeChat середовище виконання:

1. `openclaw plugins install` встановлює `@tencent-weixin/openclaw-weixin`.
2. Gateway знаходить маніфест Plugin і завантажує точку входу Plugin.
3. Plugin реєструє id каналу `openclaw-weixin`.
4. `openclaw channels login --channel openclaw-weixin` запускає вхід за QR-кодом.
5. Plugin зберігає облікові дані облікового запису в каталозі стану OpenClaw.
6. Коли Gateway запускається, Plugin запускає свій монітор Weixin для кожного
   налаштованого облікового запису.
7. Вхідні повідомлення WeChat нормалізуються через контракт каналу, спрямовуються
   до вибраного агента OpenClaw і надсилаються назад через вихідний шлях Plugin.

Це розділення важливе: ядро OpenClaw має залишатися незалежним від каналів. Вхід
у WeChat, виклики Tencent iLink API, завантаження й отримання медіа, токени
контексту та моніторинг облікових записів належать зовнішньому Plugin.

## Встановлення

Швидке встановлення:

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

Ручне встановлення:

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

Перезапустіть Gateway після встановлення:

```bash
openclaw gateway restart
```

## Вхід

Запустіть вхід за QR-кодом на тій самій машині, де працює Gateway:

```bash
openclaw channels login --channel openclaw-weixin
```

Відскануйте QR-код у WeChat на телефоні й підтвердьте вхід. Plugin зберігає
токен облікового запису локально після успішного сканування.

Щоб додати інший обліковий запис WeChat, знову виконайте ту саму команду входу.
Для кількох облікових записів ізолюйте сеанси прямих повідомлень за обліковим
записом, каналом і відправником:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## Керування доступом

Прямі повідомлення використовують звичайну модель сполучення OpenClaw і список
дозволених для канальних Plugin.

Схваліть нових відправників:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

Повну модель керування доступом дивіться в розділі [Сполучення](/uk/channels/pairing).

## Сумісність

Plugin перевіряє версію хоста OpenClaw під час запуску.

| Лінія Plugin | Версія OpenClaw         | npm-тег  |
| ------------ | ----------------------- | -------- |
| `2.x`        | `>=2026.3.22`           | `latest` |
| `1.x`        | `>=2026.1.0 <2026.3.22` | `legacy` |

Якщо Plugin повідомляє, що ваша версія OpenClaw застаріла, оновіть OpenClaw або
встановіть legacy-лінію Plugin:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Процес sidecar

Plugin WeChat може виконувати допоміжну роботу поруч із Gateway, поки моніторить
Tencent iLink API. У issue #68451 цей допоміжний шлях виявив помилку в
загальному очищенні застарілого Gateway в OpenClaw: дочірній процес міг
спробувати очистити батьківський процес Gateway, спричиняючи цикли перезапуску
під менеджерами процесів, такими як systemd.

Поточне очищення під час запуску OpenClaw виключає поточний процес і його
предків, тому допоміжний процес каналу не повинен завершувати Gateway, який його
запустив. Це виправлення загальне; це не специфічний для WeChat шлях у ядрі.

## Усунення несправностей

Перевірте встановлення і статус:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

Якщо канал відображається як встановлений, але не підключається, підтвердьте, що
Plugin увімкнено, і перезапустіть:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

Якщо Gateway багаторазово перезапускається після ввімкнення WeChat, оновіть і
OpenClaw, і Plugin:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

Якщо під час запуску повідомляється, що встановлений пакет Plugin `requires compiled runtime
output for TypeScript entry`, npm-пакет було опубліковано без скомпільованих
файлів середовища виконання JavaScript, потрібних OpenClaw. Оновіть або
перевстановіть після того, як видавець Plugin випустить виправлений пакет, або
тимчасово вимкніть чи видаліть Plugin.

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
- SDK канального Plugin: [SDK канального Plugin](/uk/plugins/sdk-channel-plugins)
- Зовнішній пакет: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
