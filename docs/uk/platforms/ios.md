---
read_when:
    - Сполучення або повторне підключення вузла iOS
    - Запуск застосунку iOS з вихідного коду
    - Налагодження виявлення Gateway або команд canvas
summary: 'iOS-застосунок вузла: підключення до Gateway, сполучення, полотно та усунення несправностей'
title: застосунок iOS
x-i18n:
    generated_at: "2026-07-02T08:45:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 26f58f5a3a4c6f918ddca493367554c2df5a34292deeb112296103dce2203743
    source_path: platforms/ios.md
    workflow: 16
---

Доступність: збірки застосунку для iPhone поширюються через канали Apple, коли це ввімкнено для релізу. Локальні розробницькі збірки також можна запускати з вихідного коду.

## Що це робить

- Підключається до Gateway через WebSocket (LAN або tailnet).
- Надає можливості вузла: Canvas, знімок екрана, захоплення з камери, місцезнаходження, режим Talk, голосове пробудження.
- Отримує команди `node.invoke` і повідомляє події стану вузла.

## Вимоги

- Gateway, запущений на іншому пристрої (macOS, Linux або Windows через WSL2).
- Мережевий шлях:
  - Та сама LAN через Bonjour, **або**
  - Tailnet через unicast DNS-SD (приклад домену: `openclaw.internal.`), **або**
  - Ручний host/port (резервний варіант).

## Швидкий старт (сполучення + підключення)

1. Запустіть Gateway:

```bash
openclaw gateway --port 18789
```

2. У застосунку iOS відкрийте Settings і виберіть виявлений gateway (або ввімкніть Manual Host і введіть host/port).

3. Підтвердьте запит на сполучення на хості gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Якщо застосунок повторює сполучення зі зміненими даними автентифікації (роль/області доступу/публічний ключ),
попередній очікуваний запит замінюється, і створюється новий `requestId`.
Перед підтвердженням знову виконайте `openclaw devices list`.

Необов’язково: якщо вузол iOS завжди підключається зі строго контрольованої підмережі, ви
можете явно ввімкнути автоматичне підтвердження вузла під час першого сполучення за допомогою явних CIDR або точних IP-адрес:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

За замовчуванням це вимкнено. Це застосовується лише до нового сполучення `role: node`
без запитаних областей доступу. Сполучення оператора/браузера та будь-яка зміна ролі, області доступу, метаданих або
публічного ключа все одно потребують ручного підтвердження.

4. Перевірте підключення:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push через relay для офіційних збірок

Офіційно поширювані збірки iOS використовують зовнішній push relay замість публікації сирого токена APNs
у gateway.

Офіційні збірки App Store з публічного каналу релізів використовують розміщений relay за адресою `https://ios-push-relay.openclaw.ai`.

Користувацькі розгортання relay потребують навмисно окремого шляху збірки/розгортання iOS, URL relay якого збігається з URL relay gateway. Публічний канал релізів App Store не приймає перевизначення користувацького URL relay. Якщо ви використовуєте користувацьку збірку relay, задайте відповідний URL relay gateway:

```json5
{
  gateway: {
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
        },
      },
    },
  },
}
```

Як працює потік:

- Застосунок iOS реєструється в relay за допомогою App Attest і JWS транзакції застосунку StoreKit.
- Relay повертає непрозорий дескриптор relay і дозвіл на надсилання, обмежений реєстрацією.
- Застосунок iOS отримує ідентичність сполученого gateway і включає її в реєстрацію relay, тому реєстрація через relay делегується саме цьому gateway.
- Застосунок пересилає цю реєстрацію через relay до сполученого gateway за допомогою `push.apns.register`.
- Gateway використовує збережений дескриптор relay для `push.test`, фонових пробуджень і підштовхувань пробудження.
- Користувацькі URL relay gateway мають збігатися з URL relay, вбудованим у збірку iOS.
- Якщо застосунок пізніше підключається до іншого gateway або збірки з іншим базовим URL relay, він оновлює реєстрацію relay замість повторного використання старої прив’язки.

Що gateway **не** потрібно для цього шляху:

- Немає загального для розгортання токена relay.
- Немає прямого ключа APNs для офіційних надсилань через relay App Store.

Очікуваний потік оператора:

1. Установіть офіційний застосунок iOS.
2. Необов’язково: задайте `gateway.push.apns.relay.baseUrl` на gateway лише під час використання навмисно окремої користувацької збірки relay.
3. Сполучіть застосунок із gateway і дайте йому завершити підключення.
4. Застосунок автоматично публікує `push.apns.register` після того, як має токен APNs, сесію оператора підключено, а реєстрація relay успішна.
5. Після цього `push.test`, пробудження для повторного підключення та підштовхування пробудження можуть використовувати збережену реєстрацію через relay.

## Фонові сигнали активності

Коли iOS пробуджує застосунок для silent push, фонового оновлення або події значної зміни місцезнаходження, застосунок
намагається коротко перепідключити вузол, а потім викликає `node.event` з `event: "node.presence.alive"`.
Gateway записує це як `lastSeenAtMs`/`lastSeenReason` у метаданих сполученого вузла/пристрою лише
після того, як відома автентифікована ідентичність пристрою вузла.

Застосунок вважає фонове пробудження успішно записаним лише тоді, коли відповідь gateway містить
`handled: true`. Старіші gateway можуть підтверджувати `node.event` через `{ "ok": true }`; ця відповідь
сумісна, але не рахується як довговічне оновлення last-seen.

Примітка щодо сумісності:

- `OPENCLAW_APNS_RELAY_BASE_URL` досі працює як тимчасове перевизначення env для gateway.
- Публічний канал релізів App Store відхиляє `OPENCLAW_PUSH_RELAY_BASE_URL` для збірок iOS.

## Автентифікація та потік довіри

Relay існує, щоб забезпечити два обмеження, які прямий APNs-on-gateway не може надати для
офіційних збірок iOS:

- Лише справжні збірки OpenClaw iOS, поширювані через Apple, можуть використовувати розміщений relay.
- Gateway може надсилати push через relay лише для пристроїв iOS, які були сполучені саме з цим
  gateway.

Крок за кроком:

1. `iOS app -> gateway`
   - Застосунок спершу сполучується з gateway через звичайний потік автентифікації Gateway.
   - Це дає застосунку автентифіковану сесію вузла та автентифіковану сесію оператора.
   - Сесія оператора використовується для виклику `gateway.identity.get`.

2. `iOS app -> relay`
   - Застосунок викликає кінцеві точки реєстрації relay через HTTPS.
   - Реєстрація містить доказ App Attest і JWS транзакції застосунку StoreKit.
   - Relay перевіряє bundle ID, доказ App Attest і доказ поширення Apple, а також вимагає
     офіційний/production шлях поширення.
   - Саме це блокує локальні збірки Xcode/dev від використання розміщеного relay. Локальна збірка може бути
     підписана, але вона не задовольняє офіційний доказ поширення Apple, якого очікує relay.

3. `gateway identity delegation`
   - Перед реєстрацією relay застосунок отримує ідентичність сполученого gateway з
     `gateway.identity.get`.
   - Застосунок включає цю ідентичність gateway у payload реєстрації relay.
   - Relay повертає дескриптор relay і дозвіл на надсилання, обмежений реєстрацією, які делеговані
     цій ідентичності gateway.

4. `gateway -> relay`
   - Gateway зберігає дескриптор relay і дозвіл на надсилання з `push.apns.register`.
   - Під час `push.test`, пробуджень для повторного підключення та підштовхувань пробудження gateway підписує запит на надсилання своєю
     власною ідентичністю пристрою.
   - Relay перевіряє і збережений дозвіл на надсилання, і підпис gateway відносно делегованої
     ідентичності gateway з реєстрації.
   - Інший gateway не може повторно використати цю збережену реєстрацію, навіть якщо якимось чином отримає дескриптор.

5. `relay -> APNs`
   - Relay володіє production-обліковими даними APNs і сирим токеном APNs для офіційної збірки.
   - Gateway ніколи не зберігає сирий токен APNs для офіційних збірок через relay.
   - Relay надсилає фінальний push до APNs від імені сполученого gateway.

Чому було створено цей дизайн:

- Щоб не зберігати production-облікові дані APNs у користувацьких gateway.
- Щоб уникнути зберігання сирих токенів APNs офіційних збірок на gateway.
- Щоб дозволити використання розміщеного relay лише для офіційних збірок OpenClaw iOS.
- Щоб запобігти надсиланню одним gateway push-пробуджень на пристрої iOS, що належать іншому gateway.

Локальні/ручні збірки залишаються на прямому APNs. Якщо ви тестуєте ці збірки без relay,
gateway усе ще потребує прямих облікових даних APNs:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Це runtime env vars хоста gateway, а не налаштування Fastlane. `apps/ios/fastlane/.env` зберігає лише
автентифікацію App Store Connect, як-от `APP_STORE_CONNECT_KEY_ID` і
`APP_STORE_CONNECT_ISSUER_ID`; він не налаштовує пряму доставку APNs для локальних збірок iOS.

Рекомендоване сховище на хості gateway:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Не комітьте файл `.p8` і не розміщуйте його в checkout репозиторію.

## Шляхи виявлення

### Bonjour (LAN)

Застосунок iOS переглядає `_openclaw-gw._tcp` на `local.` і, коли налаштовано, той самий
домен wide-area DNS-SD discovery. Gateway у тій самій LAN автоматично з’являються з `local.`;
виявлення між мережами може використовувати налаштований wide-area домен без зміни типу beacon.

### Tailnet (між мережами)

Якщо mDNS заблоковано, використовуйте unicast DNS-SD zone (виберіть домен; приклад:
`openclaw.internal.`) і Tailscale split DNS.
Див. [Bonjour](/uk/gateway/bonjour) для прикладу CoreDNS.

### Ручний host/port

У Settings увімкніть **Manual Host** і введіть host gateway + port (за замовчуванням `18789`).

## Canvas + A2UI

Вузол iOS рендерить canvas WKWebView. Використовуйте `node.invoke`, щоб керувати ним:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Примітки:

- Хост canvas Gateway обслуговує `/__openclaw__/canvas/` і `/__openclaw__/a2ui/`.
- Він обслуговується з HTTP-сервера Gateway (той самий порт, що й `gateway.port`, за замовчуванням `18789`).
- Вузол iOS зберігає вбудований scaffold як стандартний підключений вигляд. `canvas.a2ui.push` і `canvas.a2ui.reset` використовують bundled сторінку A2UI, що належить застосунку.
- Віддалені сторінки Gateway A2UI на iOS доступні лише для рендерингу; native дії кнопок A2UI приймаються лише з bundled сторінок, що належать застосунку.
- Поверніться до вбудованого scaffold за допомогою `canvas.navigate` і `{"url":""}`.

## Зв’язок із Computer Use

Застосунок iOS є мобільною поверхнею вузла, а не backend Codex Computer Use. Codex
Computer Use і `cua-driver mcp` керують локальним робочим столом macOS через інструменти
MCP; застосунок iOS надає можливості iPhone через команди вузла OpenClaw,
як-от `canvas.*`, `camera.*`, `screen.*`, `location.*` і `talk.*`.

Агенти все ще можуть керувати застосунком iOS через OpenClaw, викликаючи команди
вузла, але ці виклики проходять через протокол вузла gateway і дотримуються обмежень iOS
для переднього/фонового режиму. Використовуйте [Codex Computer Use](/uk/plugins/codex-computer-use)
для керування локальним desktop і цю сторінку для можливостей вузла iOS.

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Голосове пробудження + режим Talk

- Голосове пробудження та режим Talk доступні в Settings.
- Вузли iOS із підтримкою Talk оголошують можливість `talk` і можуть декларувати
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` і `talk.ptt.once`;
  Gateway за замовчуванням дозволяє ці push-to-talk команди для довірених
  вузлів із підтримкою Talk.
- iOS може призупиняти фонове аудіо; вважайте голосові функції best-effort, коли застосунок не активний.

## Поширені помилки

- `NODE_BACKGROUND_UNAVAILABLE`: виведіть застосунок iOS на передній план (команди canvas/camera/screen цього потребують).
- `A2UI_HOST_UNAVAILABLE`: bundled сторінка A2UI була недоступна у WebView застосунку; тримайте застосунок на передньому плані на вкладці Screen і повторіть спробу.
- Запит на сполучення ніколи не з’являється: виконайте `openclaw devices list` і підтвердьте вручну.
- Повторне підключення не вдається після перевстановлення: токен сполучення Keychain було очищено; повторно сполучіть вузол.

## Пов’язані документи

- [Сполучення](/uk/channels/pairing)
- [Виявлення](/uk/gateway/discovery)
- [Bonjour](/uk/gateway/bonjour)
