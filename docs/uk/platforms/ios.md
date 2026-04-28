---
read_when:
    - Сполучення або повторне підключення iOS Node
    - Запуск iOS-застосунку з вихідного коду
    - Налагодження виявлення Gateway або команд полотна
summary: 'iOS-застосунок вузла: підключення до Gateway, сполучення, полотно та усунення несправностей'
title: застосунок iOS
x-i18n:
    generated_at: "2026-04-28T11:18:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fdbe578f15d2641d1bcb147fee7626486210cceae0cc355a92b3b2dd6291c35
    source_path: platforms/ios.md
    workflow: 16
---

Доступність: внутрішній попередній перегляд. Застосунок iOS ще не розповсюджується публічно.

## Що він робить

- Підключається до Gateway через WebSocket (LAN або tailnet).
- Надає можливості Node: полотно, знімок екрана, захоплення камерою, місцезнаходження, режим розмови, голосове пробудження.
- Отримує команди `node.invoke` і повідомляє про події стану Node.

## Вимоги

- Gateway запущено на іншому пристрої (macOS, Linux або Windows через WSL2).
- Мережевий шлях:
  - Та сама LAN через Bonjour, **або**
  - Tailnet через unicast DNS-SD (приклад домену: `openclaw.internal.`), **або**
  - Ручний хост/порт (резервний варіант).

## Швидкий старт (створення пари + підключення)

1. Запустіть Gateway:

```bash
openclaw gateway --port 18789
```

2. У застосунку iOS відкрийте Settings і виберіть виявлений Gateway (або ввімкніть Manual Host і введіть хост/порт).

3. Схваліть запит на створення пари на хості Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Якщо застосунок повторює спробу створення пари зі зміненими даними автентифікації (роль/області доступу/публічний ключ),
попередній очікуваний запит замінюється, і створюється новий `requestId`.
Перед схваленням знову виконайте `openclaw devices list`.

Необов’язково: якщо iOS Node завжди підключається з жорстко контрольованої підмережі, ви
можете ввімкнути автоматичне схвалення Node під час першого підключення за допомогою явних CIDR або точних IP:

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

За замовчуванням це вимкнено. Це застосовується лише до нового створення пари `role: node`
без запитаних областей доступу. Створення пари для оператора/браузера та будь-яка зміна ролі, області доступу, метаданих або
публічного ключа все одно потребує ручного схвалення.

4. Перевірте підключення:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push через relay для офіційних збірок

Офіційно розповсюджувані збірки iOS використовують зовнішній push relay замість публікації сирого токена APNs
у Gateway.

Вимога на боці Gateway:

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
- Relay повертає непрозорий relay handle і дозвіл на надсилання, обмежений цією реєстрацією.
- Застосунок iOS отримує ідентичність Gateway, з яким створено пару, і додає її до реєстрації в relay, щоб реєстрація через relay була делегована саме цьому Gateway.
- Застосунок пересилає цю реєстрацію через relay до Gateway, з яким створено пару, за допомогою `push.apns.register`.
- Gateway використовує збережений relay handle для `push.test`, фонових пробуджень і підштовхувань пробудження.
- Базова URL-адреса relay у Gateway має збігатися з URL-адресою relay, вбудованою в офіційну/TestFlight збірку iOS.
- Якщо застосунок згодом підключається до іншого Gateway або збірки з іншою базовою URL-адресою relay, він оновлює реєстрацію в relay замість повторного використання старої прив’язки.

Що Gateway **не** потрібно для цього шляху:

- Немає relay-токена для всього розгортання.
- Немає прямого ключа APNs для офіційних/TestFlight надсилань через relay.

Очікуваний потік оператора:

1. Встановіть офіційну/TestFlight збірку iOS.
2. Встановіть `gateway.push.apns.relay.baseUrl` у Gateway.
3. Створіть пару між застосунком і Gateway та дочекайтеся завершення підключення.
4. Застосунок автоматично публікує `push.apns.register` після того, як має токен APNs, операторська сесія підключена, а реєстрація в relay успішна.
5. Після цього `push.test`, пробудження для повторного підключення і підштовхування пробудження можуть використовувати збережену реєстрацію через relay.

## Фонові сигнали активності

Коли iOS пробуджує застосунок для silent push, фонового оновлення або події значної зміни місцезнаходження, застосунок
намагається швидко повторно підключити Node, а потім викликає `node.event` з `event: "node.presence.alive"`.
Gateway записує це як `lastSeenAtMs`/`lastSeenReason` у метаданих Node/пристрою, з яким створено пару, лише
після того, як відома автентифікована ідентичність пристрою Node.

Застосунок вважає фонове пробудження успішно записаним лише тоді, коли відповідь Gateway містить
`handled: true`. Старіші Gateway можуть підтверджувати `node.event` через `{ "ok": true }`; така відповідь
сумісна, але не рахується як довговічне оновлення останнього появлення.

Примітка щодо сумісності:

- `OPENCLAW_APNS_RELAY_BASE_URL` все ще працює як тимчасове перевизначення env для Gateway.

## Автентифікація та потік довіри

Relay існує, щоб забезпечити дві умови, які прямий APNs-на-Gateway не може надати для
офіційних збірок iOS:

- Лише справжні збірки OpenClaw iOS, розповсюджені через Apple, можуть використовувати hosted relay.
- Gateway може надсилати push через relay лише для пристроїв iOS, які створили пару саме з цим
  Gateway.

Крок за кроком:

1. `iOS app -> gateway`
   - Застосунок спочатку створює пару з Gateway через звичайний потік автентифікації Gateway.
   - Це дає застосунку автентифіковану сесію Node, а також автентифіковану операторську сесію.
   - Операторська сесія використовується для виклику `gateway.identity.get`.

2. `iOS app -> relay`
   - Застосунок викликає кінцеві точки реєстрації relay через HTTPS.
   - Реєстрація містить доказ App Attest і JWS транзакції застосунку StoreKit.
   - Relay перевіряє bundle ID, доказ App Attest і доказ розповсюдження Apple, а також вимагає
     офіційний/виробничий шлях розповсюдження.
   - Саме це блокує використання hosted relay локальними Xcode/dev збірками. Локальна збірка може бути
     підписана, але вона не задовольняє доказ офіційного розповсюдження Apple, якого очікує relay.

3. `gateway identity delegation`
   - Перед реєстрацією в relay застосунок отримує ідентичність Gateway, з яким створено пару, з
     `gateway.identity.get`.
   - Застосунок додає цю ідентичність Gateway до payload реєстрації в relay.
   - Relay повертає relay handle і дозвіл на надсилання, обмежений реєстрацією, які делеговані
     цій ідентичності Gateway.

4. `gateway -> relay`
   - Gateway зберігає relay handle і дозвіл на надсилання з `push.apns.register`.
   - Під час `push.test`, пробуджень для повторного підключення і підштовхувань пробудження Gateway підписує запит на надсилання своєю
     власною ідентичністю пристрою.
   - Relay перевіряє і збережений дозвіл на надсилання, і підпис Gateway відносно делегованої
     ідентичності Gateway з реєстрації.
   - Інший Gateway не може повторно використати цю збережену реєстрацію, навіть якщо якимось чином отримає handle.

5. `relay -> APNs`
   - Relay володіє production-обліковими даними APNs і сирим токеном APNs для офіційної збірки.
   - Gateway ніколи не зберігає сирий токен APNs для офіційних збірок через relay.
   - Relay надсилає фінальний push до APNs від імені Gateway, з яким створено пару.

Чому було створено цей дизайн:

- Щоб тримати production-облікові дані APNs поза користувацькими Gateway.
- Щоб уникнути зберігання сирих токенів APNs офіційних збірок у Gateway.
- Щоб дозволити використання hosted relay лише для офіційних/TestFlight збірок OpenClaw.
- Щоб запобігти надсиланню push-пробуджень одним Gateway на пристрої iOS, що належать іншому Gateway.

Локальні/ручні збірки залишаються на прямому APNs. Якщо ви тестуєте ці збірки без relay,
Gateway все ще потребує прямих облікових даних APNs:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Це runtime env vars хоста Gateway, а не налаштування Fastlane. `apps/ios/fastlane/.env` зберігає лише
автентифікацію App Store Connect / TestFlight, як-от `ASC_KEY_ID` і `ASC_ISSUER_ID`; він не налаштовує
пряму доставку APNs для локальних збірок iOS.

Рекомендоване зберігання на хості Gateway:

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

Застосунок iOS переглядає `_openclaw-gw._tcp` у `local.` і, коли налаштовано, той самий
домен wide-area DNS-SD для виявлення. Gateway у тій самій LAN автоматично з’являються з `local.`;
міжмережеве виявлення може використовувати налаштований wide-area домен без зміни типу beacon.

### Tailnet (міжмережевий)

Якщо mDNS заблоковано, використовуйте зону unicast DNS-SD (виберіть домен; приклад:
`openclaw.internal.`) і Tailscale split DNS.
Див. [Bonjour](/uk/gateway/bonjour) для прикладу CoreDNS.

### Ручний хост/порт

У Settings увімкніть **Manual Host** і введіть хост Gateway + порт (за замовчуванням `18789`).

## Полотно + A2UI

iOS Node рендерить полотно WKWebView. Використовуйте `node.invoke`, щоб керувати ним:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Примітки:

- Хост полотна Gateway обслуговує `/__openclaw__/canvas/` і `/__openclaw__/a2ui/`.
- Він обслуговується з HTTP-сервера Gateway (той самий порт, що й `gateway.port`, за замовчуванням `18789`).
- iOS Node автоматично переходить до A2UI під час підключення, коли оголошено URL-адресу хоста полотна.
- Поверніться до вбудованого scaffold за допомогою `canvas.navigate` і `{"url":""}`.

## Зв’язок із Computer Use

Застосунок iOS є мобільною поверхнею Node, а не backend Codex Computer Use. Codex
Computer Use і `cua-driver mcp` керують локальним desktop macOS через інструменти MCP;
застосунок iOS надає можливості iPhone через команди Node OpenClaw,
як-от `canvas.*`, `camera.*`, `screen.*`, `location.*` і `talk.*`.

Агенти все ще можуть керувати застосунком iOS через OpenClaw, викликаючи команди
Node, але ці виклики проходять через протокол Node у Gateway і підпорядковуються
обмеженням iOS у foreground/background. Використовуйте [Codex Computer Use](/uk/plugins/codex-computer-use)
для керування локальним desktop, а цю сторінку — для можливостей iOS Node.

### Eval / snapshot полотна

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Голосове пробудження + режим розмови

- Голосове пробудження і режим розмови доступні в Settings.
- iOS може призупиняти фонове аудіо; вважайте голосові функції best-effort, коли застосунок неактивний.

## Поширені помилки

- `NODE_BACKGROUND_UNAVAILABLE`: виведіть застосунок iOS на передній план (команди canvas/camera/screen цього потребують).
- `A2UI_HOST_NOT_CONFIGURED`: Gateway не оголосив URL-адресу хоста полотна; перевірте `canvasHost` у [конфігурації Gateway](/uk/gateway/configuration).
- Запит на створення пари ніколи не з’являється: виконайте `openclaw devices list` і схваліть вручну.
- Повторне підключення не вдається після перевстановлення: токен пари в Keychain було очищено; повторно створіть пару з Node.

## Пов’язані документи

- [Створення пари](/uk/channels/pairing)
- [Виявлення](/uk/gateway/discovery)
- [Bonjour](/uk/gateway/bonjour)
