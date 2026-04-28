---
read_when:
    - Сполучення або повторне підключення вузла iOS
    - Запуск застосунку для iOS з початкового коду
    - Налагодження виявлення Gateway або команд canvas
summary: 'застосунок Node для iOS: підключення до Gateway, сполучення, canvas і усунення несправностей'
title: застосунок для iOS
x-i18n:
    generated_at: "2026-04-28T00:49:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 41d96525ff38ab19b5fdd622da954d4b2bdd66380230fc8db7a811b2865dd446
    source_path: platforms/ios.md
    workflow: 15
---

Доступність: внутрішній попередній перегляд. Застосунок для iOS ще не розповсюджується публічно.

## Що він робить

- Підключається до Gateway через WebSocket (LAN або tailnet).
- Надає можливості вузла: Canvas, знімок екрана, захоплення з камери, місцезнаходження, режим розмови, голосове пробудження.
- Отримує команди `node.invoke` і повідомляє про події стану вузла.

## Вимоги

- Gateway, запущений на іншому пристрої (macOS, Linux або Windows через WSL2).
- Мережевий шлях:
  - Та сама LAN через Bonjour, **або**
  - Tailnet через unicast DNS-SD (приклад домену: `openclaw.internal.`), **або**
  - Ручне введення хоста/порту (резервний варіант).

## Швидкий старт (сполучення + підключення)

1. Запустіть Gateway:

```bash
openclaw gateway --port 18789
```

2. У застосунку для iOS відкрийте Settings і виберіть виявлений gateway (або ввімкніть Manual Host і введіть хост/порт).

3. Підтвердьте запит на сполучення на хості gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Якщо застосунок повторює спробу сполучення зі зміненими даними автентифікації (role/scopes/public key),
попередній очікувальний запит замінюється, і створюється новий `requestId`.
Перед підтвердженням знову виконайте `openclaw devices list`.

Необов’язково: якщо вузол iOS завжди підключається з жорстко контрольованої підмережі, ви
можете ввімкнути автоматичне підтвердження нового вузла під час першого підключення за явними CIDR або точними IP-адресами:

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

За замовчуванням це вимкнено. Це застосовується лише до нового сполучення `role: node` без
запитаних областей доступу. Сполучення operator/browser і будь-яка зміна role, scope, metadata або
public key, як і раніше, вимагають ручного підтвердження.

4. Перевірте підключення:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push із relay для офіційних збірок

Офіційно розповсюджувані збірки iOS використовують зовнішній push relay замість публікації сирого токена APNs
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

Як працює цей процес:

- Застосунок для iOS реєструється в relay за допомогою App Attest і JWS транзакції застосунку StoreKit.
- Relay повертає непрозорий дескриптор relay разом із дозволом на надсилання в межах реєстрації.
- Застосунок для iOS отримує identity сполученого gateway і включає її в реєстрацію relay, тому реєстрація через relay делегується саме цьому gateway.
- Застосунок передає цю реєстрацію через relay до сполученого gateway за допомогою `push.apns.register`.
- Gateway використовує збережений дескриптор relay для `push.test`, фонових пробуджень і сигналів пробудження.
- Базовий URL relay у gateway має збігатися з URL relay, вбудованим в офіційну/TestFlight збірку iOS.
- Якщо згодом застосунок підключається до іншого gateway або до збірки з іншим базовим URL relay, він оновлює реєстрацію relay замість повторного використання старої прив’язки.

Що gateway **не** потрібне для цього шляху:

- Жоден relay token для всього розгортання.
- Жоден прямий ключ APNs для надсилань через relay в офіційних/TestFlight збірках.

Очікуваний сценарій для оператора:

1. Установіть офіційну/TestFlight збірку iOS.
2. Встановіть `gateway.push.apns.relay.baseUrl` на gateway.
3. Сполучіть застосунок із gateway і дайте йому завершити підключення.
4. Застосунок автоматично публікує `push.apns.register`, щойно в нього з’явиться токен APNs, буде підключено сеанс оператора і успішно завершиться реєстрація relay.
5. Після цього `push.test`, пробудження для повторного підключення і сигнали пробудження можуть використовувати збережену реєстрацію через relay.

Примітка щодо сумісності:

- `OPENCLAW_APNS_RELAY_BASE_URL` і далі працює як тимчасове перевизначення env для gateway.

## Потік автентифікації та довіри

Relay існує, щоб забезпечити два обмеження, які прямий APNs-on-gateway не може забезпечити для
офіційних збірок iOS:

- Лише справжні збірки OpenClaw для iOS, розповсюджені через Apple, можуть використовувати розміщений relay.
- Gateway може надсилати push через relay лише для пристроїв iOS, які були сполучені саме з цим
  gateway.

Покроково:

1. `iOS app -> gateway`
   - Спочатку застосунок проходить сполучення з gateway через звичайний потік автентифікації Gateway.
   - Це дає застосунку автентифікований сеанс вузла плюс автентифікований сеанс оператора.
   - Сеанс оператора використовується для виклику `gateway.identity.get`.

2. `iOS app -> relay`
   - Застосунок викликає кінцеві точки реєстрації relay через HTTPS.
   - Реєстрація включає доказ App Attest плюс JWS транзакції застосунку StoreKit.
   - Relay перевіряє bundle ID, доказ App Attest і доказ розповсюдження через Apple та вимагає
     офіційний/production шлях розповсюдження.
   - Саме це блокує використання розміщеного relay локальними збірками Xcode/dev. Локальна збірка може бути
     підписаною, але вона не задовольняє доказ офіційного розповсюдження через Apple, який очікує relay.

3. `gateway identity delegation`
   - Перед реєстрацією relay застосунок отримує identity сполученого gateway через
     `gateway.identity.get`.
   - Застосунок включає цю identity gateway у payload реєстрації relay.
   - Relay повертає дескриптор relay і дозвіл на надсилання в межах реєстрації, делеговані
     цій identity gateway.

4. `gateway -> relay`
   - Gateway зберігає дескриптор relay і дозвіл на надсилання з `push.apns.register`.
   - Під час `push.test`, пробуджень для повторного підключення і сигналів пробудження gateway підписує запит на надсилання
     власною identity пристрою.
   - Relay перевіряє і збережений дозвіл на надсилання, і підпис gateway відносно делегованої
     identity gateway з реєстрації.
   - Інший gateway не може повторно використати цю збережену реєстрацію, навіть якщо якимось чином отримає дескриптор.

5. `relay -> APNs`
   - Relay володіє production-обліковими даними APNs і сирим токеном APNs для офіційної збірки.
   - Gateway ніколи не зберігає сирий токен APNs для офіційних збірок через relay.
   - Relay надсилає фінальний push до APNs від імені сполученого gateway.

Чому було створено цей дизайн:

- Щоб production-облікові дані APNs не зберігалися в gateway користувачів.
- Щоб уникнути зберігання сирих токенів APNs офіційних збірок на gateway.
- Щоб дозволити використання розміщеного relay лише для офіційних/TestFlight збірок OpenClaw.
- Щоб не допустити надсилання push-сигналів пробудження одним gateway до пристроїв iOS, що належать іншому gateway.

Локальні/ручні збірки й далі використовують прямий APNs. Якщо ви тестуєте такі збірки без relay,
gateway, як і раніше, потребує прямих облікових даних APNs:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Це env-змінні середовища виконання хоста gateway, а не налаштування Fastlane. `apps/ios/fastlane/.env` зберігає лише
дані автентифікації App Store Connect / TestFlight, як-от `ASC_KEY_ID` і `ASC_ISSUER_ID`; він не налаштовує
пряму доставку APNs для локальних збірок iOS.

Рекомендоване зберігання на хості gateway:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Не комітьте файл `.p8` і не розміщуйте його в каталозі репозиторію.

## Шляхи виявлення

### Bonjour (LAN)

Застосунок для iOS виконує пошук `_openclaw-gw._tcp` на `local.` і, якщо налаштовано, у тій самій
зоні wide-area DNS-SD discovery. Gateway у тій самій LAN автоматично з’являються через `local.`;
виявлення між мережами може використовувати налаштований wide-area домен без зміни типу beacon.

### Tailnet (між мережами)

Якщо mDNS заблоковано, використовуйте зону unicast DNS-SD (оберіть домен; приклад:
`openclaw.internal.`) і split DNS у Tailscale.
Див. [Bonjour](/uk/gateway/bonjour) для прикладу CoreDNS.

### Ручний хост/порт

У Settings увімкніть **Manual Host** і введіть хост gateway + порт (типово `18789`).

## Canvas + A2UI

Вузол iOS рендерить canvas у WKWebView. Використовуйте `node.invoke`, щоб керувати ним:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Примітки:

- Хост canvas у Gateway обслуговує `/__openclaw__/canvas/` і `/__openclaw__/a2ui/`.
- Він обслуговується HTTP-сервером Gateway (той самий порт, що й `gateway.port`, типово `18789`).
- Вузол iOS автоматично переходить до A2UI під час підключення, коли рекламується URL хоста canvas.
- Повернутися до вбудованого scaffold можна за допомогою `canvas.navigate` і `{"url":""}`.

## Зв’язок із Computer Use

Застосунок для iOS — це поверхня мобільного вузла, а не бекенд Codex Computer Use. Codex
Computer Use і `cua-driver mcp` керують локальним робочим столом macOS через інструменти MCP;
застосунок для iOS надає можливості iPhone через команди вузла OpenClaw, такі як
`canvas.*`, `camera.*`, `screen.*`, `location.*` і `talk.*`.

Агенти все ще можуть працювати із застосунком для iOS через OpenClaw, викликаючи команди
вузла, але ці виклики проходять через протокол вузла gateway і дотримуються обмежень iOS
для переднього й фонового режимів. Використовуйте [Codex Computer Use](/uk/plugins/codex-computer-use)
для керування локальним робочим столом, а цю сторінку — для можливостей вузла iOS.

### Eval / знімок canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Голосове пробудження + режим розмови

- Голосове пробудження і режим розмови доступні в Settings.
- iOS може призупиняти фонове аудіо; розглядайте голосові функції як best-effort, коли застосунок не активний.

## Поширені помилки

- `NODE_BACKGROUND_UNAVAILABLE`: переведіть застосунок для iOS на передній план (для команд canvas/camera/screen це обов’язково).
- `A2UI_HOST_NOT_CONFIGURED`: Gateway не рекламував URL хоста canvas; перевірте `canvasHost` у [конфігурації Gateway](/uk/gateway/configuration).
- Запит на сполучення не з’являється: виконайте `openclaw devices list` і підтвердьте вручну.
- Повторне підключення не вдається після перевстановлення: токен сполучення в Keychain було очищено; сполучіть вузол повторно.

## Пов’язана документація

- [Сполучення](/uk/channels/pairing)
- [Виявлення](/uk/gateway/discovery)
- [Bonjour](/uk/gateway/bonjour)
