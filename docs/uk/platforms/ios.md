---
read_when:
    - Спарювання або повторне підключення iOS Node
    - Запуск застосунку iOS із вихідного коду
    - Налагодження виявлення Gateway або команд полотна
summary: 'Застосунок вузла iOS: підключення до Gateway, сполучення, полотно та усунення несправностей'
title: застосунок iOS
x-i18n:
    generated_at: "2026-05-06T01:52:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: aaa8c11d9fda32c743d2ff0d1c6fd5574bcd396aef43aa2e4e9b0cc7b55e5d21
    source_path: platforms/ios.md
    workflow: 16
---

Доступність: внутрішній попередній перегляд. Застосунок iOS ще не розповсюджується публічно.

## Що він робить

- Підключається до Gateway через WebSocket (LAN або tailnet).
- Надає можливості вузла: Canvas, знімок екрана, зйомка камерою, місцезнаходження, режим розмови, голосове пробудження.
- Отримує команди `node.invoke` і повідомляє події стану вузла.

## Вимоги

- Gateway, запущений на іншому пристрої (macOS, Linux або Windows через WSL2).
- Мережевий шлях:
  - Та сама LAN через Bonjour, **або**
  - Tailnet через unicast DNS-SD (приклад домену: `openclaw.internal.`), **або**
  - Ручний host/port (резервний варіант).

## Швидкий старт (створити пару + підключити)

1. Запустіть Gateway:

```bash
openclaw gateway --port 18789
```

2. У застосунку iOS відкрийте Settings і виберіть виявлений gateway (або ввімкніть Manual Host і введіть host/port).

3. Підтвердьте запит на створення пари на хості gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Якщо застосунок повторює створення пари зі зміненими даними автентифікації (role/scopes/public key),
попередній запит в очікуванні замінюється, і створюється новий `requestId`.
Перед підтвердженням знову виконайте `openclaw devices list`.

Необов’язково: якщо вузол iOS завжди підключається з жорстко контрольованої підмережі, ви
можете ввімкнути автоматичне підтвердження вузла під час першого підключення з явними CIDR або точними IP:

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
без запитаних scopes. Створення пари для оператора/браузера, а також будь-яка зміна ролі, scope, metadata або
public-key усе одно потребує ручного підтвердження.

4. Перевірте підключення:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push із relay для офіційних збірок

Офіційно розповсюджувані збірки iOS використовують зовнішній push relay замість публікації сирого токена APNs
на gateway.

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
- Relay повертає непрозорий relay handle і дозвіл на надсилання, обмежений реєстрацією.
- Застосунок iOS отримує ідентичність спареного gateway і включає її до реєстрації relay, тому реєстрація з relay делегується цьому конкретному gateway.
- Застосунок пересилає цю реєстрацію з relay до спареного gateway через `push.apns.register`.
- Gateway використовує збережений relay handle для `push.test`, фонових пробуджень і м’яких пробуджень.
- Базова URL-адреса relay у gateway має збігатися з URL-адресою relay, вбудованою в офіційну/TestFlight збірку iOS.
- Якщо застосунок пізніше підключиться до іншого gateway або до збірки з іншою базовою URL-адресою relay, він оновить реєстрацію relay замість повторного використання старої прив’язки.

Що gateway **не** потребує для цього шляху:

- Немає relay token на рівні розгортання.
- Немає прямого ключа APNs для офіційних/TestFlight надсилань через relay.

Очікуваний потік оператора:

1. Встановіть офіційну/TestFlight збірку iOS.
2. Налаштуйте `gateway.push.apns.relay.baseUrl` на gateway.
3. Створіть пару між застосунком і gateway та дочекайтеся завершення підключення.
4. Застосунок автоматично публікує `push.apns.register` після того, як має токен APNs, сеанс оператора підключено, а реєстрація relay успішна.
5. Після цього `push.test`, пробудження для повторного підключення та м’які пробудження можуть використовувати збережену реєстрацію з relay.

## Фонові сигнали alive

Коли iOS пробуджує застосунок для silent push, фонового оновлення або події значущої зміни місцезнаходження, застосунок
намагається коротко повторно підключити вузол, а потім викликає `node.event` з `event: "node.presence.alive"`.
Gateway записує це як `lastSeenAtMs`/`lastSeenReason` у metadata спареного вузла/пристрою лише
після того, як відома автентифікована ідентичність пристрою вузла.

Застосунок вважає фонове пробудження успішно записаним лише тоді, коли відповідь gateway містить
`handled: true`. Старіші gateway можуть підтверджувати `node.event` через `{ "ok": true }`; така відповідь
сумісна, але не зараховується як стійке оновлення last-seen.

Примітка щодо сумісності:

- `OPENCLAW_APNS_RELAY_BASE_URL` усе ще працює як тимчасове перевизначення env для gateway.

## Автентифікація та потік довіри

Relay існує, щоб забезпечити два обмеження, які прямий APNs на gateway не може надати для
офіційних збірок iOS:

- Лише справжні збірки OpenClaw для iOS, розповсюджені через Apple, можуть використовувати hosted relay.
- Gateway може надсилати push через relay лише для пристроїв iOS, які створили пару саме з цим
  gateway.

Крок за кроком:

1. `iOS app -> gateway`
   - Застосунок спочатку створює пару з gateway через звичайний потік автентифікації Gateway.
   - Це дає застосунку автентифікований сеанс вузла та автентифікований сеанс оператора.
   - Сеанс оператора використовується для виклику `gateway.identity.get`.

2. `iOS app -> relay`
   - Застосунок викликає кінцеві точки реєстрації relay через HTTPS.
   - Реєстрація включає доказ App Attest і JWS транзакції застосунку StoreKit.
   - Relay перевіряє bundle ID, доказ App Attest і доказ розповсюдження Apple, а також вимагає
     офіційний/production шлях розповсюдження.
   - Саме це блокує використання hosted relay локальними збірками Xcode/dev. Локальна збірка може бути
     підписана, але вона не задовольняє офіційний доказ розповсюдження Apple, якого очікує relay.

3. `gateway identity delegation`
   - Перед реєстрацією relay застосунок отримує ідентичність спареного gateway з
     `gateway.identity.get`.
   - Застосунок включає цю ідентичність gateway до payload реєстрації relay.
   - Relay повертає relay handle і дозвіл на надсилання, обмежений реєстрацією, які делеговано
     цій ідентичності gateway.

4. `gateway -> relay`
   - Gateway зберігає relay handle і дозвіл на надсилання з `push.apns.register`.
   - Під час `push.test`, пробуджень для повторного підключення та м’яких пробуджень gateway підписує запит на надсилання власною
     ідентичністю пристрою.
   - Relay перевіряє і збережений дозвіл на надсилання, і підпис gateway відносно делегованої
     ідентичності gateway з реєстрації.
   - Інший gateway не може повторно використати цю збережену реєстрацію, навіть якщо якось отримає handle.

5. `relay -> APNs`
   - Relay володіє production обліковими даними APNs і сирим токеном APNs для офіційної збірки.
   - Gateway ніколи не зберігає сирий токен APNs для офіційних збірок з relay.
   - Relay надсилає фінальний push до APNs від імені спареного gateway.

Чому було створено такий дизайн:

- Щоб не зберігати production облікові дані APNs у gateway користувачів.
- Щоб уникнути зберігання сирих токенів APNs офіційних збірок на gateway.
- Щоб дозволити використання hosted relay лише для офіційних/TestFlight збірок OpenClaw.
- Щоб не допустити надсилання пробуджувальних push до пристроїв iOS, що належать іншому gateway.

Локальні/ручні збірки залишаються на прямому APNs. Якщо ви тестуєте ці збірки без relay,
gateway усе одно потребує прямих облікових даних APNs:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Це runtime env vars хоста gateway, а не налаштування Fastlane. `apps/ios/fastlane/.env` зберігає лише
автентифікацію App Store Connect / TestFlight, наприклад `ASC_KEY_ID` і `ASC_ISSUER_ID`; він не налаштовує
пряму доставку APNs для локальних збірок iOS.

Рекомендоване зберігання на хості gateway:

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
домен wide-area DNS-SD виявлення. Gateway в тій самій LAN автоматично з’являються з `local.`;
міжмережеве виявлення може використовувати налаштований wide-area домен без зміни типу маяка.

### Tailnet (міжмережевий)

Якщо mDNS заблоковано, використовуйте unicast DNS-SD зону (виберіть домен; приклад:
`openclaw.internal.`) і Tailscale split DNS.
Див. [Bonjour](/uk/gateway/bonjour) для прикладу CoreDNS.

### Ручний host/port

У Settings увімкніть **Manual Host** і введіть gateway host + port (за замовчуванням `18789`).

## Canvas + A2UI

Вузол iOS рендерить WKWebView canvas. Використовуйте `node.invoke`, щоб ним керувати:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Примітки:

- Хост Canvas у Gateway обслуговує `/__openclaw__/canvas/` і `/__openclaw__/a2ui/`.
- Він обслуговується з HTTP-сервера Gateway (той самий port, що й `gateway.port`, за замовчуванням `18789`).
- Вузол iOS автоматично переходить до A2UI під час підключення, коли оголошено URL хоста canvas.
- Поверніться до вбудованого scaffold через `canvas.navigate` і `{"url":""}`.

## Зв’язок із Computer Use

Застосунок iOS є мобільною поверхнею вузла, а не backend для Codex Computer Use. Codex
Computer Use і `cua-driver mcp` керують локальним робочим столом macOS через інструменти MCP;
застосунок iOS надає можливості iPhone через команди вузла OpenClaw,
як-от `canvas.*`, `camera.*`, `screen.*`, `location.*` і `talk.*`.

Агенти все ще можуть працювати із застосунком iOS через OpenClaw, викликаючи команди вузла,
але ці виклики проходять через протокол вузла gateway і підпорядковуються обмеженням iOS
для foreground/background. Використовуйте [Codex Computer Use](/uk/plugins/codex-computer-use)
для керування локальним робочим столом і цю сторінку для можливостей вузла iOS.

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Голосове пробудження + режим розмови

- Голосове пробудження та режим розмови доступні в Settings.
- Вузли iOS з підтримкою розмови оголошують можливість `talk` і можуть декларувати
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` і `talk.ptt.once`;
  Gateway дозволяє ці push-to-talk команди за замовчуванням для довірених
  вузлів з підтримкою розмови.
- iOS може призупиняти фоновий аудіо; розглядайте голосові функції як best-effort, коли застосунок не активний.

## Поширені помилки

- `NODE_BACKGROUND_UNAVAILABLE`: виведіть застосунок iOS на передній план (команди canvas/camera/screen цього потребують).
- `A2UI_HOST_NOT_CONFIGURED`: Gateway не оголосив URL хоста canvas; перевірте `canvasHost` у [конфігурації Gateway](/uk/gateway/configuration).
- Запит на створення пари ніколи не з’являється: виконайте `openclaw devices list` і підтвердьте вручну.
- Повторне підключення не вдається після перевстановлення: токен створення пари Keychain було очищено; повторно створіть пару з вузлом.

## Пов’язані документи

- [Створення пари](/uk/channels/pairing)
- [Виявлення](/uk/gateway/discovery)
- [Bonjour](/uk/gateway/bonjour)
