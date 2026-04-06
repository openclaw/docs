---
read_when:
    - Pairing або повторне підключення iOS-вузла
    - Запуск iOS-застосунку з вихідного коду
    - Налагодження виявлення шлюзу або команд canvas
summary: 'iOS-застосунок вузла: підключення до Gateway, pairing, canvas і усунення несправностей'
title: iOS App
x-i18n:
    generated_at: "2026-04-06T15:29:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: f3e0a6e33e72d4c9f1f17ef70a1b67bae9ebe4a2dca16677ea6b28d0ddac1b4e
    source_path: platforms/ios.md
    workflow: 15
---

# iOS App (вузол)

Доступність: внутрішнє preview. iOS-застосунок ще не розповсюджується публічно.

## Що він робить

- Підключається до Gateway через WebSocket (LAN або tailnet).
- Надає можливості вузла: Canvas, знімок екрана, захоплення з камери, геолокація, режим розмови, Voice wake.
- Отримує команди `node.invoke` і повідомляє події стану вузла.

## Вимоги

- Gateway запущений на іншому пристрої (macOS, Linux або Windows через WSL2).
- Мережевий шлях:
  - Та сама LAN через Bonjour, **або**
  - Tailnet через unicast DNS-SD (приклад домену: `openclaw.internal.`), **або**
  - Ручне задання host/port (резервний варіант).

## Швидкий старт (pair + connect)

1. Запустіть Gateway:

```bash
openclaw gateway --port 18789
```

2. У застосунку iOS відкрийте Settings і виберіть знайдений gateway (або ввімкніть Manual Host і введіть host/port).

3. Схваліть запит pairing на хості шлюзу:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Якщо застосунок повторює спробу pairing зі зміненими даними автентифікації (роль/scopes/публічний ключ),
попередній незавершений запит замінюється, і створюється новий `requestId`.
Перед схваленням знову виконайте `openclaw devices list`.

4. Перевірте підключення:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push через relay для офіційних збірок

Офіційні розповсюджувані збірки iOS використовують зовнішній push relay замість публікації сирого токена APNs
у шлюз.

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

- iOS-застосунок реєструється в relay за допомогою App Attest і receipt застосунку.
- Relay повертає непрозорий relay handle разом із send grant, обмеженим областю реєстрації.
- iOS-застосунок отримує ідентичність pair-ованого gateway і включає її в реєстрацію relay, тож relay-backed реєстрація делегується саме цьому gateway.
- Застосунок передає цю relay-backed реєстрацію pair-ованому gateway через `push.apns.register`.
- Gateway використовує збережений relay handle для `push.test`, фонових пробуджень і wake nudges.
- Base URL relay шлюзу має збігатися з URL relay, вбудованим в офіційну/TestFlight збірку iOS.
- Якщо застосунок пізніше підключиться до іншого gateway або до збірки з іншим base URL relay, він оновить relay-реєстрацію замість повторного використання старої прив’язки.

Що gateway **не** потрібно для цього шляху:

- Жодного relay-токена для всього розгортання.
- Жодного прямого ключа APNs для relay-backed надсилання в офіційних/TestFlight збірках.

Очікуваний потік для оператора:

1. Встановіть офіційну/TestFlight збірку iOS.
2. Задайте `gateway.push.apns.relay.baseUrl` на шлюзі.
3. Pair-уйте застосунок зі шлюзом і дочекайтеся завершення підключення.
4. Застосунок автоматично публікує `push.apns.register`, щойно матиме токен APNs, сесію оператора буде підключено, а реєстрація relay завершиться успішно.
5. Після цього `push.test`, пробудження для перепідключення та wake nudges зможуть використовувати збережену relay-backed реєстрацію.

Примітка щодо сумісності:

- `OPENCLAW_APNS_RELAY_BASE_URL` як і раніше працює як тимчасове перевизначення env для gateway.

## Потік автентифікації та довіри

Relay існує, щоб забезпечити дві умови, які прямий APNs-on-gateway не може надати для
офіційних збірок iOS:

- Лише справжні збірки OpenClaw для iOS, розповсюджені через Apple, можуть використовувати hosted relay.
- Gateway може надсилати relay-backed push лише для iOS-пристроїв, які виконали pairing саме з цим
  gateway.

Покроково:

1. `iOS app -> gateway`
   - Спочатку застосунок виконує pairing зі шлюзом через звичайний потік автентифікації Gateway.
   - Це дає застосунку автентифіковану сесію вузла та автентифіковану сесію оператора.
   - Сесія оператора використовується для виклику `gateway.identity.get`.

2. `iOS app -> relay`
   - Застосунок викликає кінцеві точки реєстрації relay через HTTPS.
   - Реєстрація включає App Attest proof і receipt застосунку.
   - Relay перевіряє bundle ID, App Attest proof і Apple receipt та вимагає
     офіційний/production шлях розповсюдження.
   - Саме це блокує локальні Xcode/dev збірки від використання hosted relay. Локальна збірка може бути
     підписана, але вона не задовольняє вимогу офіційного підтвердження розповсюдження через Apple, яку очікує relay.

3. `делегування ідентичності gateway`
   - Перед реєстрацією relay застосунок отримує ідентичність pair-ованого gateway через
     `gateway.identity.get`.
   - Застосунок включає цю ідентичність gateway у payload реєстрації relay.
   - Relay повертає relay handle і send grant, обмежений областю реєстрації, делеговані
     цій ідентичності gateway.

4. `gateway -> relay`
   - Gateway зберігає relay handle і send grant з `push.apns.register`.
   - Для `push.test`, пробуджень перепідключення і wake nudges gateway підписує запит на надсилання
     власною ідентичністю пристрою.
   - Relay перевіряє і збережений send grant, і підпис gateway щодо делегованої
     ідентичності gateway з реєстрації.
   - Інший gateway не може повторно використати цю збережену реєстрацію, навіть якщо якимось чином отримає handle.

5. `relay -> APNs`
   - Relay володіє production-обліковими даними APNs і сирим токеном APNs для офіційної збірки.
   - Gateway ніколи не зберігає сирий токен APNs для relay-backed офіційних збірок.
   - Relay надсилає фінальний push до APNs від імені pair-ованого gateway.

Навіщо створено цей дизайн:

- Щоб production-облікові дані APNs не потрапляли на шлюзи користувачів.
- Щоб не зберігати сирі токени APNs офіційних збірок на gateway.
- Щоб дозволити використання hosted relay лише для офіційних/TestFlight збірок OpenClaw.
- Щоб один gateway не міг надсилати push-пробудження на iOS-пристрої, що належать іншому gateway.

Локальні/ручні збірки й надалі використовують прямий APNs. Якщо ви тестуєте такі збірки без relay,
gateway, як і раніше, потребує прямих облікових даних APNs:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Це env vars runtime на хості gateway, а не налаштування Fastlane. `apps/ios/fastlane/.env` зберігає лише
облікові дані App Store Connect / TestFlight, такі як `ASC_KEY_ID` і `ASC_ISSUER_ID`; він не налаштовує
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

iOS-застосунок шукає `_openclaw-gw._tcp` у `local.` і, якщо налаштовано, у тому самому
домені wide-area DNS-SD discovery. Gateway у тій самій LAN автоматично з’являються через `local.`;
міжмережеве виявлення може використовувати налаштований wide-area домен без зміни типу beacon.

### Tailnet (міжмережевий)

Якщо mDNS заблоковано, використовуйте зону unicast DNS-SD (виберіть домен; приклад:
`openclaw.internal.`) і Tailscale split DNS.
Див. [Bonjour](/uk/gateway/bonjour) для прикладу CoreDNS.

### Ручний host/port

У Settings увімкніть **Manual Host** і введіть host шлюзу + port (типово `18789`).

## Canvas + A2UI

iOS-вузол рендерить canvas у WKWebView. Використовуйте `node.invoke`, щоб керувати ним:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Примітки:

- Canvas host Gateway обслуговує `/__openclaw__/canvas/` і `/__openclaw__/a2ui/`.
- Він обслуговується HTTP-сервером Gateway (той самий port, що й `gateway.port`, типово `18789`).
- iOS-вузол автоматично переходить до A2UI під час підключення, коли рекламується URL canvas host.
- Поверніться до вбудованого scaffold за допомогою `canvas.navigate` і `{"url":""}`.

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + talk mode

- Voice wake і режим розмови доступні в Settings.
- iOS може призупиняти фонове аудіо; розглядайте голосові функції як best-effort, коли застосунок не активний.

## Поширені помилки

- `NODE_BACKGROUND_UNAVAILABLE`: переведіть iOS-застосунок на передній план (команди canvas/camera/screen цього потребують).
- `A2UI_HOST_NOT_CONFIGURED`: Gateway не оголосив URL canvas host; перевірте `canvasHost` у [конфігурації Gateway](/uk/gateway/configuration).
- Запит pairing ніколи не з’являється: виконайте `openclaw devices list` і схваліть його вручну.
- Повторне підключення не працює після перевстановлення: токен pairing у Keychain було очищено; виконайте pairing вузла знову.

## Пов’язані документи

- [Pairing](/uk/channels/pairing)
- [Discovery](/uk/gateway/discovery)
- [Bonjour](/uk/gateway/bonjour)
