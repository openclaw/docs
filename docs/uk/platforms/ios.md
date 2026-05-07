---
read_when:
    - Створення пари або повторне підключення вузла iOS
    - Запуск застосунку iOS із вихідного коду
    - Налагодження виявлення Gateway або команд полотна
summary: 'Застосунок вузла iOS: підключення до Gateway, створення пари, полотно й усунення несправностей'
title: Застосунок iOS
x-i18n:
    generated_at: "2026-05-07T15:09:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 707f8b97156e800f89bc00265c1889c9cbade347fde35f037a302065956346f4
    source_path: platforms/ios.md
    workflow: 16
---

Доступність: внутрішній попередній перегляд. Застосунок iOS ще не розповсюджується публічно.

## Що він робить

- Підключається до Gateway через WebSocket (LAN або tailnet).
- Надає можливості вузла: Canvas, знімок екрана, захоплення камерою, місцезнаходження, режим розмови, голосове пробудження.
- Отримує команди `node.invoke` і повідомляє події стану вузла.

## Вимоги

- Gateway, що працює на іншому пристрої (macOS, Linux або Windows через WSL2).
- Мережевий шлях:
  - Той самий LAN через Bonjour, **або**
  - Tailnet через unicast DNS-SD (приклад домену: `openclaw.internal.`), **або**
  - Ручний host/port (резервний варіант).

## Швидкий старт (сполучення + підключення)

1. Запустіть Gateway:

```bash
openclaw gateway --port 18789
```

2. У застосунку iOS відкрийте Settings і виберіть виявлений gateway (або увімкніть Manual Host і введіть host/port).

3. Схваліть запит на сполучення на хості gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Якщо застосунок повторює сполучення зі зміненими даними автентифікації (role/scopes/public key),
попередній очікуваний запит замінюється, і створюється новий `requestId`.
Перед схваленням знову виконайте `openclaw devices list`.

Необов’язково: якщо вузол iOS завжди підключається з жорстко контрольованої підмережі, ви
можете погодитися на автоматичне схвалення вузла під час першого підключення з явними CIDR або точними IP:

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

Це вимкнено за замовчуванням. Це застосовується лише до нового сполучення `role: node`
без запитаних scopes. Сполучення operator/browser і будь-яка зміна role, scope, metadata або
public-key все одно потребують ручного схвалення.

4. Перевірте підключення:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push на основі relay для офіційних збірок

Офіційно розповсюджувані збірки iOS використовують зовнішній push relay замість публікації сирого APNs
token у gateway.

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

- Застосунок iOS реєструється в relay за допомогою App Attest і StoreKit app transaction JWS.
- Relay повертає непрозорий relay handle і send grant, обмежений областю реєстрації.
- Застосунок iOS отримує ідентичність сполученого gateway і включає її в реєстрацію relay, тому relay-backed реєстрація делегується цьому конкретному gateway.
- Застосунок пересилає цю relay-backed реєстрацію до сполученого gateway через `push.apns.register`.
- Gateway використовує збережений relay handle для `push.test`, фонових пробуджень і wake nudges.
- Базова URL-адреса gateway relay має збігатися з relay URL, вбудованою в офіційну/TestFlight збірку iOS.
- Якщо застосунок пізніше підключається до іншого gateway або збірки з іншою базовою URL-адресою relay, він оновлює реєстрацію relay замість повторного використання старої прив’язки.

Що gateway **не** потрібно для цього шляху:

- Немає relay token на рівні всього розгортання.
- Немає прямого APNs key для офіційних/TestFlight relay-backed надсилань.

Очікуваний потік оператора:

1. Установіть офіційну/TestFlight збірку iOS.
2. Установіть `gateway.push.apns.relay.baseUrl` на gateway.
3. Сполучіть застосунок із gateway і дайте йому завершити підключення.
4. Застосунок автоматично публікує `push.apns.register` після того, як має APNs token, операторська сесія підключена, а реєстрація relay успішна.
5. Після цього `push.test`, пробудження для повторного підключення і wake nudges можуть використовувати збережену relay-backed реєстрацію.

## Фонові сигнали alive

Коли iOS пробуджує застосунок через silent push, background refresh або significant-location event, застосунок
намагається виконати коротке повторне підключення вузла, а потім викликає `node.event` з `event: "node.presence.alive"`.
Gateway записує це як `lastSeenAtMs`/`lastSeenReason` у metadata сполученого вузла/пристрою лише
після того, як відома автентифікована ідентичність вузлового пристрою.

Застосунок вважає фонове пробудження успішно записаним лише тоді, коли відповідь gateway містить
`handled: true`. Старіші gateway можуть підтверджувати `node.event` через `{ "ok": true }`; така відповідь
сумісна, але не зараховується як довговічне оновлення last-seen.

Примітка щодо сумісності:

- `OPENCLAW_APNS_RELAY_BASE_URL` усе ще працює як тимчасове env-перевизначення для gateway.

## Автентифікація і потік довіри

Relay існує, щоб забезпечити два обмеження, які прямий APNs-on-gateway не може надати для
офіційних збірок iOS:

- Лише справжні збірки OpenClaw iOS, розповсюджені через Apple, можуть використовувати розміщений relay.
- Gateway може надсилати relay-backed push лише для пристроїв iOS, які сполучилися саме з цим
  gateway.

Крок за кроком:

1. `iOS app -> gateway`
   - Застосунок спочатку сполучується з gateway через звичайний потік автентифікації Gateway.
   - Це дає застосунку автентифіковану сесію вузла плюс автентифіковану операторську сесію.
   - Операторська сесія використовується для виклику `gateway.identity.get`.

2. `iOS app -> relay`
   - Застосунок викликає кінцеві точки реєстрації relay через HTTPS.
   - Реєстрація включає доказ App Attest плюс StoreKit app transaction JWS.
   - Relay перевіряє bundle ID, доказ App Attest і доказ розповсюдження Apple та вимагає
     офіційний/production шлях розповсюдження.
   - Саме це блокує локальні Xcode/dev збірки від використання розміщеного relay. Локальна збірка може бути
     підписаною, але вона не задовольняє офіційний доказ розповсюдження Apple, якого очікує relay.

3. `gateway identity delegation`
   - Перед реєстрацією relay застосунок отримує ідентичність сполученого gateway з
     `gateway.identity.get`.
   - Застосунок включає цю ідентичність gateway у payload реєстрації relay.
   - Relay повертає relay handle і send grant, обмежений областю реєстрації, делеговані
     цій ідентичності gateway.

4. `gateway -> relay`
   - Gateway зберігає relay handle і send grant з `push.apns.register`.
   - Під час `push.test`, пробуджень для повторного підключення і wake nudges gateway підписує запит на надсилання своєю
     власною ідентичністю пристрою.
   - Relay перевіряє як збережений send grant, так і підпис gateway щодо делегованої
     ідентичності gateway з реєстрації.
   - Інший gateway не може повторно використати цю збережену реєстрацію, навіть якщо якось отримає handle.

5. `relay -> APNs`
   - Relay володіє production APNs credentials і сирим APNs token для офіційної збірки.
   - Gateway ніколи не зберігає сирий APNs token для relay-backed офіційних збірок.
   - Relay надсилає фінальний push до APNs від імені сполученого gateway.

Навіщо було створено цей дизайн:

- Щоб не зберігати production APNs credentials у користувацьких gateway.
- Щоб уникнути зберігання сирих APNs tokens офіційних збірок на gateway.
- Щоб дозволити використання розміщеного relay лише для офіційних/TestFlight збірок OpenClaw.
- Щоб запобігти надсиланню wake pushes одним gateway на пристрої iOS, що належать іншому gateway.

Локальні/ручні збірки залишаються на прямому APNs. Якщо ви тестуєте ці збірки без relay,
gateway усе ще потребує прямих APNs credentials:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Це runtime env vars хоста gateway, а не налаштування Fastlane. `apps/ios/fastlane/.env` зберігає лише
автентифікацію App Store Connect / TestFlight, як-от `ASC_KEY_ID` і `ASC_ISSUER_ID`; він не налаштовує
пряму доставку APNs для локальних збірок iOS.

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
міжмережеве виявлення може використовувати налаштований wide-area домен без зміни типу beacon.

### Tailnet (міжмережевий)

Якщо mDNS заблоковано, використайте unicast DNS-SD зону (виберіть домен; приклад:
`openclaw.internal.`) і Tailscale split DNS.
Див. [Bonjour](/uk/gateway/bonjour) для прикладу CoreDNS.

### Ручний host/port

У Settings увімкніть **Manual Host** і введіть хост gateway + port (за замовчуванням `18789`).

## Canvas + A2UI

Вузол iOS рендерить canvas WKWebView. Використовуйте `node.invoke`, щоб ним керувати:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Примітки:

- Хост canvas Gateway обслуговує `/__openclaw__/canvas/` і `/__openclaw__/a2ui/`.
- Він обслуговується з HTTP-сервера Gateway (той самий порт, що й `gateway.port`, за замовчуванням `18789`).
- Вузол iOS автоматично переходить до A2UI під час підключення, коли оголошено URL хоста canvas.
- Поверніться до вбудованого scaffold через `canvas.navigate` і `{"url":""}`.

## Зв’язок із Computer Use

Застосунок iOS є мобільною поверхнею вузла, а не бекендом Codex Computer Use. Codex
Computer Use і `cua-driver mcp` керують локальним робочим столом macOS через інструменти MCP;
застосунок iOS надає можливості iPhone через команди вузла OpenClaw,
такі як `canvas.*`, `camera.*`, `screen.*`, `location.*` і `talk.*`.

Агенти все ще можуть керувати застосунком iOS через OpenClaw, викликаючи команди
вузла, але ці виклики проходять через протокол вузла gateway і підпорядковуються обмеженням iOS
для переднього плану/фону. Використовуйте [Codex Computer Use](/uk/plugins/codex-computer-use)
для локального керування робочим столом і цю сторінку для можливостей вузла iOS.

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Голосове пробудження + режим розмови

- Голосове пробудження і режим розмови доступні в Settings.
- Talk-capable вузли iOS оголошують можливість `talk` і можуть декларувати
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` і `talk.ptt.once`;
  Gateway дозволяє ці push-to-talk команди за замовчуванням для довірених
  Talk-capable вузлів.
- iOS може призупиняти фоновий звук; вважайте голосові функції best-effort, коли застосунок неактивний.

## Поширені помилки

- `NODE_BACKGROUND_UNAVAILABLE`: виведіть застосунок iOS на передній план (команди canvas/camera/screen цього потребують).
- `A2UI_HOST_NOT_CONFIGURED`: Gateway не оголосив URL поверхні Canvas Plugin; перевірте `plugins.entries.canvas.config.host` у [конфігурації Gateway](/uk/gateway/configuration).
- Запит на сполучення ніколи не з’являється: виконайте `openclaw devices list` і схваліть вручну.
- Повторне підключення не вдається після перевстановлення: token сполучення Keychain було очищено; повторно сполучіть вузол.

## Пов’язані документи

- [Сполучення](/uk/channels/pairing)
- [Виявлення](/uk/gateway/discovery)
- [Bonjour](/uk/gateway/bonjour)
