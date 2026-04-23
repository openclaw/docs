---
read_when:
    - Pairing або повторне підключення вузла iOS
    - Запуск застосунку iOS зі source
    - Налагодження виявлення gateway або команд canvas
summary: 'Застосунок-вузол iOS: підключення до Gateway, pairing, canvas і усунення несправностей'
title: Застосунок iOS
x-i18n:
    generated_at: "2026-04-23T21:00:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59e95d05257ff46fda16235a8b0e5999c99ec18c2ba425e1911be97e34d3747e
    source_path: platforms/ios.md
    workflow: 15
---

# Застосунок iOS (вузол)

Доступність: internal preview. Застосунок iOS поки що публічно не розповсюджується.

## Що він робить

- Підключається до Gateway через WebSocket (LAN або tailnet).
- Надає можливості вузла: Canvas, знімок Screen, захоплення Camera, Location, Talk mode, Voice wake.
- Отримує команди `node.invoke` і надсилає події стану вузла.

## Вимоги

- Gateway, запущений на іншому пристрої (macOS, Linux або Windows через WSL2).
- Мережевий шлях:
  - Та сама LAN через Bonjour, **або**
  - Tailnet через unicast DNS-SD (приклад домену: `openclaw.internal.`), **або**
  - Ручний host/port (запасний варіант).

## Швидкий старт (pair + connect)

1. Запустіть Gateway:

```bash
openclaw gateway --port 18789
```

2. У застосунку iOS відкрийте Settings і виберіть виявлений gateway (або ввімкніть Manual Host і введіть host/port).

3. Схваліть pairing-запит на хості gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Якщо застосунок повторно намагається pair-итися зі зміненими даними auth (role/scopes/public key),
попередній pending-запит замінюється, і створюється новий `requestId`.
Перед схваленням знову запустіть `openclaw devices list`.

4. Перевірте з’єднання:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push через relay для офіційних збірок

Офіційні розповсюджувані збірки iOS використовують зовнішній push relay замість публікації сирого APNs
token безпосередньо в gateway.

Вимога на боці gateway:

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

- Застосунок iOS реєструється в relay за допомогою App Attest і app receipt.
- Relay повертає непрозорий relay handle плюс send grant, прив’язаний до області реєстрації.
- Застосунок iOS отримує identity pairing gateway і включає її в relay registration, тож relay-backed реєстрація делегується саме цьому gateway.
- Застосунок пересилає цю relay-backed реєстрацію до paired gateway через `push.apns.register`.
- Gateway використовує цей збережений relay handle для `push.test`, background wake і wake nudge.
- Базовий URL relay у gateway має збігатися з URL relay, baked у офіційну/TestFlight збірку iOS.
- Якщо пізніше застосунок підключається до іншого gateway або до збірки з іншим relay base URL, він оновлює relay registration замість повторного використання старого binding.

Що gateway **не** потребує для цього шляху:

- Не потрібен relay token на рівні всього розгортання.
- Не потрібен прямий APNs key для офіційних/TestFlight relay-backed надсилань.

Очікуваний потік для оператора:

1. Встановіть офіційну/TestFlight збірку iOS.
2. Задайте `gateway.push.apns.relay.baseUrl` у gateway.
3. Pair-іть застосунок із gateway і дайте йому завершити підключення.
4. Застосунок автоматично публікує `push.apns.register` після того, як отримає APNs token, підключиться operator session і успішно завершить relay registration.
5. Після цього `push.test`, reconnect wake і wake nudge можуть використовувати збережену relay-backed реєстрацію.

Примітка щодо сумісності:

- `OPENCLAW_APNS_RELAY_BASE_URL` усе ще працює як тимчасове env-перевизначення для gateway.

## Потік автентифікації та довіри

Relay існує, щоб забезпечити два обмеження, які прямий APNs-на-gateway не може надати для
офіційних збірок iOS:

- Лише справжні збірки OpenClaw для iOS, розповсюджені через Apple, можуть використовувати хостований relay.
- Gateway може надсилати relay-backed push лише для iOS-пристроїв, які pair-илися саме з цим
  gateway.

Крок за кроком:

1. `iOS app -> gateway`
   - Спочатку застосунок pair-иться з gateway через звичайний потік auth Gateway.
   - Це дає застосунку автентифіковану node session плюс автентифіковану operator session.
   - Operator session використовується для виклику `gateway.identity.get`.

2. `iOS app -> relay`
   - Застосунок викликає endpoint-и реєстрації relay через HTTPS.
   - Реєстрація включає доказ App Attest плюс app receipt.
   - Relay перевіряє bundle ID, доказ App Attest і Apple receipt та вимагає
     офіційний/production-шлях розповсюдження.
   - Саме це блокує локальні Xcode/dev-збірки від використання хостованого relay. Локальна збірка може бути
     підписана, але вона не задовольняє офіційний доказ розповсюдження Apple, якого очікує relay.

3. `делегування identity gateway`
   - Перед relay registration застосунок отримує identity paired gateway через
     `gateway.identity.get`.
   - Застосунок включає цю identity gateway в payload relay registration.
   - Relay повертає relay handle і send grant, прив’язаний до області реєстрації, які делеговані цій
     identity gateway.

4. `gateway -> relay`
   - Gateway зберігає relay handle і send grant із `push.apns.register`.
   - Під час `push.test`, reconnect wake і wake nudge gateway підписує send request своїм
     власним device identity.
   - Relay перевіряє і збережений send grant, і підпис gateway відносно делегованої
     identity gateway з реєстрації.
   - Інший gateway не може повторно використати цю збережену реєстрацію, навіть якщо якимось чином отримає handle.

5. `relay -> APNs`
   - Relay володіє production-обліковими даними APNs і сирим APNs token для офіційної збірки.
   - Gateway ніколи не зберігає сирий APNs token для relay-backed офіційних збірок.
   - Relay надсилає фінальний push до APNs від імені paired gateway.

Навіщо було створено цю схему:

- Щоб тримати production-облікові дані APNs поза gateway користувача.
- Щоб не зберігати сирі APNs token-и офіційних збірок у gateway.
- Щоб дозволити використання хостованого relay лише для офіційних/TestFlight збірок OpenClaw.
- Щоб один gateway не міг надсилати wake push на iOS-пристрої, що належать іншому gateway.

Локальні/ручні збірки залишаються на прямому APNs. Якщо ви тестуєте такі збірки без relay, gateway
усе ще потребує прямі облікові дані APNs:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Це env-змінні runtime на хості gateway, а не налаштування Fastlane. `apps/ios/fastlane/.env` зберігає лише
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

Застосунок iOS переглядає `_openclaw-gw._tcp` на `local.` і, коли налаштовано, ту саму
wide-area DNS-SD discovery domain. Gateway-и в тій самій LAN з’являються автоматично з `local.`; для виявлення через різні мережі можна використовувати налаштований wide-area domain без зміни типу beacon.

### Tailnet (міжмережевий доступ)

Якщо mDNS заблоковано, використовуйте зону unicast DNS-SD (виберіть домен; приклад:
`openclaw.internal.`) і Tailscale split DNS.
Див. [Bonjour](/uk/gateway/bonjour) для прикладу CoreDNS.

### Ручний host/port

У Settings увімкніть **Manual Host** і введіть host gateway + port (типово `18789`).

## Canvas + A2UI

Вузол iOS рендерить canvas через WKWebView. Керуйте ним через `node.invoke`:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Примітки:

- Canvas host Gateway обслуговує `/__openclaw__/canvas/` і `/__openclaw__/a2ui/`.
- Він обслуговується HTTP-сервером Gateway (той самий порт, що й `gateway.port`, типово `18789`).
- Вузол iOS автоматично переходить до A2UI після підключення, коли рекламується URL canvas host.
- Повернутися до вбудованого scaffold можна через `canvas.navigate` і `{"url":""}`.

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + talk mode

- Voice wake і talk mode доступні в Settings.
- iOS може призупиняти background audio; ставтеся до голосових функцій як до best-effort, коли застосунок неактивний.

## Поширені помилки

- `NODE_BACKGROUND_UNAVAILABLE`: переведіть застосунок iOS на передній план (команди canvas/camera/screen цього потребують).
- `A2UI_HOST_NOT_CONFIGURED`: Gateway не рекламував URL canvas host; перевірте `canvasHost` у [Конфігурація Gateway](/uk/gateway/configuration).
- Prompt pairing ніколи не з’являється: виконайте `openclaw devices list` і схваліть вручну.
- Повторне підключення не вдається після перевстановлення: pairing token у Keychain було очищено; pair-іть вузол заново.

## Пов’язані документи

- [Pairing](/uk/channels/pairing)
- [Виявлення](/uk/gateway/discovery)
- [Bonjour](/uk/gateway/bonjour)
