---
read_when:
    - Зіставлення або повторне підключення Node для iOS
    - Запуск застосунку iOS з джерельного коду
    - Налагодження виявлення gateway або команд canvas
summary: 'Застосунок Node для iOS: підключення до Gateway, зіставлення, canvas і усунення несправностей'
title: застосунок iOS
x-i18n:
    generated_at: "2026-04-25T05:56:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad0088cd135168248cfad10c24715f74117a66efaa52a572579c04f96a806538
    source_path: platforms/ios.md
    workflow: 15
---

Доступність: внутрішній preview. Застосунок iOS ще не розповсюджується публічно.

## Що він робить

- Підключається до Gateway через WebSocket (LAN або tailnet).
- Надає можливості Node: Canvas, знімок екрана, захоплення з камери, Location, режим розмови, голосове пробудження.
- Отримує команди `node.invoke` і повідомляє події status Node.

## Вимоги

- Gateway, запущений на іншому пристрої (macOS, Linux або Windows через WSL2).
- Мережевий шлях:
  - Та сама LAN через Bonjour, **або**
  - Tailnet через unicast DNS-SD (приклад домену: `openclaw.internal.`), **або**
  - Ручне введення host/port (резервний варіант).

## Швидкий старт (зіставлення + підключення)

1. Запустіть Gateway:

```bash
openclaw gateway --port 18789
```

2. У застосунку iOS відкрийте Settings і виберіть виявлений gateway (або ввімкніть Manual Host і введіть host/port).

3. Підтвердьте запит на зіставлення на host gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Якщо застосунок повторює спробу зіставлення зі зміненими даними auth (role/scopes/public key),
попередній очікувальний запит заміщується, і створюється новий `requestId`.
Перед підтвердженням знову виконайте `openclaw devices list`.

Необов’язково: якщо Node для iOS завжди підключається з жорстко контрольованої підмережі, ви
можете явно ввімкнути автоматичне підтвердження Node при першому підключенні через CIDR або точні IP:

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

Це типово вимкнено. Застосовується лише до нового зіставлення `role: node` без
запитаних scopes. Зіставлення operator/browser і будь-які зміни role, scope, metadata або
public key, як і раніше, потребують ручного підтвердження.

4. Перевірте підключення:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push через relay для офіційних збірок

Офіційні розповсюджувані збірки iOS використовують зовнішній push relay замість публікації сирого токена APNs
до gateway.

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

Як працює цей потік:

- Застосунок iOS реєструється в relay за допомогою App Attest і app receipt.
- Relay повертає непрозорий relay handle разом із send grant у межах реєстрації.
- Застосунок iOS отримує identity зіставленого gateway і включає її в реєстрацію relay, тому реєстрація через relay делегується саме цьому gateway.
- Застосунок пересилає цю реєстрацію через relay до зіставленого gateway за допомогою `push.apns.register`.
- Gateway використовує збережений relay handle для `push.test`, фонових пробуджень і wake nudges.
- Базовий URL relay gateway має збігатися з URL relay, вбудованим в офіційну/TestFlight збірку iOS.
- Якщо застосунок згодом підключається до іншого gateway або до збірки з іншим базовим URL relay, він оновлює реєстрацію relay замість повторного використання старої прив’язки.

Що gateway **не** потрібне для цього шляху:

- Не потрібен relay token для всього розгортання.
- Не потрібен прямий ключ APNs для надсилання через relay в офіційних/TestFlight збірках.

Очікуваний потік для оператора:

1. Встановіть офіційну/TestFlight збірку iOS.
2. Установіть `gateway.push.apns.relay.baseUrl` на gateway.
3. Зіставте застосунок із gateway і дочекайтеся завершення підключення.
4. Застосунок публікує `push.apns.register` автоматично після того, як отримано токен APNs, підключено сесію оператора і успішно виконано реєстрацію в relay.
5. Після цього `push.test`, пробудження при повторному підключенні і wake nudges можуть використовувати збережену реєстрацію через relay.

Примітка щодо сумісності:

- `OPENCLAW_APNS_RELAY_BASE_URL` як і раніше працює як тимчасове перевизначення env для gateway.

## Потік автентифікації й довіри

Relay існує для забезпечення двох обмежень, які прямий APNs-на-gateway не може надати для
офіційних збірок iOS:

- Лише справжні збірки OpenClaw для iOS, розповсюджені через Apple, можуть використовувати розміщений relay.
- Gateway може надсилати push через relay лише для пристроїв iOS, які були зіставлені саме з цим
  gateway.

Покроково:

1. `iOS app -> gateway`
   - Застосунок спочатку проходить зіставлення з gateway через звичайний потік auth Gateway.
   - Це надає застосунку автентифіковану сесію Node плюс автентифіковану сесію оператора.
   - Сесія оператора використовується для виклику `gateway.identity.get`.

2. `iOS app -> relay`
   - Застосунок викликає кінцеві точки реєстрації relay через HTTPS.
   - Реєстрація включає доказ App Attest разом із app receipt.
   - Relay перевіряє bundle ID, доказ App Attest і Apple receipt, а також вимагає
     офіційний/production шлях розповсюдження.
   - Саме це блокує локальні Xcode/dev збірки від використання розміщеного relay. Локальна збірка може бути
     підписаною, але не задовольняє доказ офіційного розповсюдження через Apple, якого очікує relay.

3. `gateway identity delegation`
   - Перед реєстрацією в relay застосунок отримує identity зіставленого gateway з
     `gateway.identity.get`.
   - Застосунок включає цю identity gateway у payload реєстрації relay.
   - Relay повертає relay handle і send grant у межах реєстрації, делеговані
     цій identity gateway.

4. `gateway -> relay`
   - Gateway зберігає relay handle і send grant із `push.apns.register`.
   - Для `push.test`, пробуджень при повторному підключенні і wake nudges gateway підписує запит на надсилання
     власною identity пристрою.
   - Relay перевіряє і збережений send grant, і підпис gateway відносно делегованої
     identity gateway з реєстрації.
   - Інший gateway не може повторно використати цю збережену реєстрацію, навіть якщо якимось чином отримає handle.

5. `relay -> APNs`
   - Relay володіє production-обліковими даними APNs і сирим токеном APNs для офіційної збірки.
   - Gateway ніколи не зберігає сирий токен APNs для офіційних збірок, що використовують relay.
   - Relay надсилає фінальний push до APNs від імені зіставленого gateway.

Чому створено цей дизайн:

- Щоб production-облікові дані APNs не потрапляли до користувацьких gateway.
- Щоб уникнути зберігання сирих токенів APNs офіційних збірок на gateway.
- Щоб дозволити використання розміщеного relay лише для офіційних/TestFlight збірок OpenClaw.
- Щоб один gateway не міг надсилати wake push на пристрої iOS, що належать іншому gateway.

Локальні/ручні збірки й далі працюють через прямий APNs. Якщо ви тестуєте такі збірки без relay,
gateway, як і раніше, потребує прямих облікових даних APNs:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Це runtime env vars host gateway, а не налаштування Fastlane. `apps/ios/fastlane/.env` зберігає лише
auth для App Store Connect / TestFlight, наприклад `ASC_KEY_ID` і `ASC_ISSUER_ID`; він не налаштовує
пряму доставку APNs для локальних збірок iOS.

Рекомендоване зберігання на host gateway:

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

Застосунок iOS шукає `_openclaw-gw._tcp` на `local.` і, за наявності конфігурації, у тій самій
wide-area DNS-SD discovery domain. Gateway у тій самій LAN з’являються автоматично через `local.`;
виявлення між мережами може використовувати налаштований wide-area domain без зміни типу beacon.

### Tailnet (міжмережевий)

Якщо mDNS заблоковано, використовуйте зону unicast DNS-SD (оберіть домен; приклад:
`openclaw.internal.`) і split DNS Tailscale.
Див. [Bonjour](/uk/gateway/bonjour) для прикладу CoreDNS.

### Ручне введення host/port

У Settings увімкніть **Manual Host** і введіть host + port gateway (типово `18789`).

## Canvas + A2UI

Node для iOS відтворює canvas у WKWebView. Використовуйте `node.invoke`, щоб керувати ним:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Примітки:

- Host canvas Gateway обслуговує `/__openclaw__/canvas/` і `/__openclaw__/a2ui/`.
- Він обслуговується HTTP-сервером Gateway (той самий port, що й `gateway.port`, типово `18789`).
- Node для iOS автоматично переходить до A2UI під час підключення, коли рекламується URL host canvas.
- Поверніться до вбудованого scaffold за допомогою `canvas.navigate` і `{"url":""}`.

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Голосове пробудження + режим розмови

- Голосове пробудження і режим розмови доступні в Settings.
- iOS може призупиняти фонове аудіо; розглядайте голосові можливості як best-effort, коли застосунок не активний.

## Поширені помилки

- `NODE_BACKGROUND_UNAVAILABLE`: переведіть застосунок iOS на передній план (команди canvas/camera/screen цього потребують).
- `A2UI_HOST_NOT_CONFIGURED`: Gateway не рекламував URL host canvas; перевірте `canvasHost` у [Конфігурація Gateway](/uk/gateway/configuration).
- Запит на зіставлення ніколи не з’являється: виконайте `openclaw devices list` і підтвердьте вручну.
- Повторне підключення не вдається після перевстановлення: токен зіставлення в Keychain було очищено; повторно зіставте Node.

## Пов’язана документація

- [Зіставлення](/uk/channels/pairing)
- [Виявлення](/uk/gateway/discovery)
- [Bonjour](/uk/gateway/bonjour)
