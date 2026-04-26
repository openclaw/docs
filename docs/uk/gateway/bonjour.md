---
read_when:
    - Налагодження проблем виявлення Bonjour на macOS/iOS
    - Зміна типів сервісів mDNS, записів TXT або UX виявлення
summary: Виявлення та налагодження Bonjour/mDNS (маяки Gateway, клієнти та типові режими відмови)
title: Виявлення Bonjour
x-i18n:
    generated_at: "2026-04-26T04:59:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: b055021bdcd92740934823dea2acf758c6ec991a15c0a315426dc359a7eea093
    source_path: gateway/bonjour.md
    workflow: 15
---

# Виявлення Bonjour / mDNS

OpenClaw використовує Bonjour (mDNS / DNS‑SD) для виявлення активного Gateway (кінцева точка WebSocket).
Багатоадресний перегляд `local.` — це **лише зручність у межах LAN**. Вбудований Plugin
`bonjour` відповідає за рекламу в LAN і ввімкнений за замовчуванням. Для виявлення між мережами
той самий маяк також можна опублікувати через налаштований домен wide-area DNS-SD.
Виявлення все одно працює за принципом best-effort і **не** замінює підключення через SSH або Tailnet.

## Wide-area Bonjour (Unicast DNS-SD) через Tailscale

Якщо node і gateway перебувають у різних мережах, багатоадресний mDNS не перетинатиме
цю межу. Ви можете зберегти той самий UX виявлення, переключившись на **unicast DNS‑SD**
("Wide‑Area Bonjour") через Tailscale.

Загальні кроки:

1. Запустіть DNS-сервер на хості gateway (доступний через Tailnet).
2. Опублікуйте записи DNS‑SD для `_openclaw-gw._tcp` у виділеній зоні
   (приклад: `openclaw.internal.`).
3. Налаштуйте **split DNS** у Tailscale так, щоб вибраний домен резолвився через цей
   DNS-сервер для клієнтів (включно з iOS).

OpenClaw підтримує будь-який домен виявлення; `openclaw.internal.` — лише приклад.
iOS/Android node переглядають і `local.`, і ваш налаштований wide-area домен.

### Конфігурація Gateway (рекомендовано)

```json5
{
  gateway: { bind: "tailnet" }, // лише tailnet (рекомендовано)
  discovery: { wideArea: { enabled: true } }, // вмикає публікацію wide-area DNS-SD
}
```

### Одноразове налаштування DNS-сервера (хост gateway)

```bash
openclaw dns setup --apply
```

Це встановить CoreDNS і налаштує його так, щоб він:

- слухав порт 53 лише на Tailscale-інтерфейсах gateway
- обслуговував вибраний домен (приклад: `openclaw.internal.`) з `~/.openclaw/dns/<domain>.db`

Перевірте з машини, підключеної до tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Налаштування DNS у Tailscale

У консолі адміністратора Tailscale:

- Додайте nameserver, що вказує на tailnet IP gateway (UDP/TCP 53).
- Додайте split DNS, щоб ваш домен виявлення використовував цей nameserver.

Після того як клієнти приймуть DNS tailnet, iOS node і CLI-виявлення зможуть переглядати
`_openclaw-gw._tcp` у вашому домені виявлення без багатоадресності.

### Безпека listener Gateway (рекомендовано)

Порт Gateway WS (типово `18789`) за замовчуванням прив’язується до loopback. Для доступу через LAN/tailnet
явно вкажіть bind і залиште автентифікацію ввімкненою.

Для конфігурацій лише з tailnet:

- Установіть `gateway.bind: "tailnet"` у `~/.openclaw/openclaw.json`.
- Перезапустіть Gateway (або перезапустіть застосунок macOS menubar).

## Що рекламується

Лише Gateway рекламує `_openclaw-gw._tcp`. Реклама через багатоадресність у LAN
забезпечується вбудованим Plugin `bonjour`; публікація wide-area DNS-SD і надалі
належить Gateway.

## Типи сервісів

- `_openclaw-gw._tcp` — транспортний маяк gateway (використовується macOS/iOS/Android node).

## Ключі TXT (не секретні підказки)

Gateway рекламує невеликі не секретні підказки, щоб зробити UI-потоки зручнішими:

- `role=gateway`
- `displayName=<дружня назва>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (лише коли TLS увімкнено)
- `gatewayTlsSha256=<sha256>` (лише коли TLS увімкнено і відбиток доступний)
- `canvasPort=<port>` (лише коли ввімкнено canvas host; наразі те саме, що й `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (лише в повному режимі mDNS, необов’язкова підказка, коли Tailnet доступний)
- `sshPort=<port>` (лише в повному режимі mDNS; wide-area DNS-SD може його не включати)
- `cliPath=<path>` (лише в повному режимі mDNS; wide-area DNS-SD все одно записує його як підказку для віддаленого встановлення)

Примітки щодо безпеки:

- Записи TXT у Bonjour/mDNS **неавтентифіковані**. Клієнти не повинні вважати TXT авторитетним джерелом маршрутизації.
- Клієнти повинні маршрутизувати, використовуючи резолвлену кінцеву точку сервісу (SRV + A/AAAA). Сприймайте `lanHost`, `tailnetDns`, `gatewayPort` і `gatewayTlsSha256` лише як підказки.
- Автоматичне націлювання SSH так само має використовувати резолвлений хост сервісу, а не підказки лише з TXT.
- TLS pinning ніколи не повинен дозволяти рекламованому `gatewayTlsSha256` перевизначати раніше збережений pin.
- iOS/Android node повинні трактувати прямі підключення на основі виявлення як **лише TLS** і вимагати явного підтвердження користувача перед довірою до відбитка, побаченого вперше.

## Налагодження на macOS

Корисні вбудовані інструменти:

- Перегляд екземплярів:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Резолв одного екземпляра (замініть `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Якщо перегляд працює, а резолв — ні, зазвичай це означає проблему з політикою LAN або
резолвером mDNS.

## Налагодження в логах Gateway

Gateway записує ротаційний файл логу (під час запуску виводиться як
`gateway log file: ...`). Шукайте рядки `bonjour:`, особливо:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

## Налагодження на iOS node

iOS node використовує `NWBrowser` для виявлення `_openclaw-gw._tcp`.

Щоб зібрати логи:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → відтворіть проблему → **Copy**

Лог містить переходи стану браузера та зміни набору результатів.

## Коли вимикати Bonjour

Вимикайте Bonjour лише тоді, коли реклама через багатоадресність у LAN недоступна або шкідлива.
Типовий випадок — Gateway, що працює за Docker bridge networking, WSL або політикою
мережі, яка відкидає багатоадресність mDNS. У таких середовищах Gateway усе ще
доступний через свою опубліковану URL-адресу, SSH, Tailnet або wide-area DNS-SD,
але автоматичне виявлення в LAN ненадійне.

Віддавайте перевагу наявному перевизначенню через середовище, коли проблема пов’язана з конкретним розгортанням:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Це вимикає рекламу через багатоадресність у LAN без зміни конфігурації Plugin.
Це безпечно для Docker-образів, service files, скриптів запуску та разового
налагодження, оскільки налаштування зникає разом із середовищем.

Використовуйте конфігурацію Plugin лише тоді, коли ви свідомо хочете вимкнути
вбудований Plugin виявлення LAN для цієї конфігурації OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Особливості Docker

Комплектний Docker Compose встановлює `OPENCLAW_DISABLE_BONJOUR=1` для сервісу Gateway
за замовчуванням. Docker bridge network зазвичай не пересилають багатоадресність mDNS
(`224.0.0.251:5353`) між контейнером і LAN, тому якщо залишити Bonjour увімкненим, це може
спричиняти повторні збої ciao `probing` або `announcing`, не забезпечуючи
працездатне виявлення.

Важливі нюанси:

- Вимкнення Bonjour не зупиняє Gateway. Воно лише зупиняє рекламу через багатоадресність у LAN.
- Вимкнення Bonjour не змінює `gateway.bind`; Docker все ще за замовчуванням використовує
  `OPENCLAW_GATEWAY_BIND=lan`, щоб опублікований порт хоста міг працювати.
- Вимкнення Bonjour не вимикає wide-area DNS-SD. Використовуйте wide-area виявлення
  або Tailnet, коли Gateway і node не в одній LAN.
- Повторне використання того самого `OPENCLAW_CONFIG_DIR` поза Docker не успадковує
  значення Compose за замовчуванням, якщо середовище все ще не задає `OPENCLAW_DISABLE_BONJOUR`.
- Встановлюйте `OPENCLAW_DISABLE_BONJOUR=0` лише для host networking, macvlan або іншої
  мережі, де багатоадресність mDNS гарантовано проходить.

## Усунення проблем із вимкненим Bonjour

Якщо node більше не виявляє Gateway автоматично після налаштування Docker:

1. Перевірте, чи Gateway навмисно пригнічує рекламу в LAN:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Переконайтеся, що сам Gateway доступний через опублікований порт:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Використовуйте пряму ціль, коли Bonjour вимкнено:
   - Control UI або локальні інструменти: `http://127.0.0.1:18789`
   - Клієнти в LAN: `http://<gateway-host>:18789`
   - Клієнти між мережами: Tailnet MagicDNS, Tailnet IP, SSH tunnel або
     wide-area DNS-SD

4. Якщо ви навмисно ввімкнули Bonjour у Docker за допомогою
   `OPENCLAW_DISABLE_BONJOUR=0`, протестуйте багатоадресність із хоста:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Якщо перегляд порожній або логи Gateway показують повторні скасування
   watchdog у ciao, поверніть `OPENCLAW_DISABLE_BONJOUR=1` і використовуйте прямий
   маршрут або маршрут через Tailnet.

## Типові режими відмови

- **Bonjour не працює між мережами**: використовуйте Tailnet або SSH.
- **Багатоадресність заблокована**: деякі мережі Wi‑Fi вимикають mDNS.
- **Advertiser застряг у probing/announcing**: хости із заблокованою багатоадресністю,
  container bridge, WSL або зміни інтерфейсів можуть залишити advertiser ciao у
  неанонсованому стані. OpenClaw робить кілька повторних спроб, а потім вимикає Bonjour
  для поточного процесу Gateway, замість того щоб безкінечно перезапускати advertiser.
- **Docker bridge networking**: комплектний Docker Compose вимикає Bonjour
  за замовчуванням через `OPENCLAW_DISABLE_BONJOUR=1`. Встановлюйте `0` лише для host,
  macvlan або іншої мережі з підтримкою mDNS.
- **Сон / зміна інтерфейсів**: macOS може тимчасово втрачати результати mDNS; повторіть спробу.
- **Перегляд працює, а резолв — ні**: робіть назви машин простими (уникайте емодзі або
  пунктуації), а потім перезапустіть Gateway. Ім’я екземпляра сервісу похідне від
  імені хоста, тому надто складні назви можуть плутати деякі резолвери.

## Екрановані імена екземплярів (`\032`)

Bonjour/DNS‑SD часто екранує байти в іменах екземплярів сервісів як десяткові послідовності `\DDD`
(наприклад, пробіли стають `\032`).

- Це нормально на рівні протоколу.
- UI повинні декодувати це для відображення (iOS використовує `BonjourEscapes.decode`).

## Вимкнення / конфігурація

- `openclaw plugins disable bonjour` вимикає рекламу через багатоадресність у LAN, вимикаючи вбудований Plugin.
- `openclaw plugins enable bonjour` відновлює стандартний Plugin виявлення LAN.
- `OPENCLAW_DISABLE_BONJOUR=1` вимикає рекламу через багатоадресність у LAN без зміни конфігурації Plugin; підтримувані truthy-значення: `1`, `true`, `yes` і `on` (legacy: `OPENCLAW_DISABLE_BONJOUR`).
- Docker Compose за замовчуванням встановлює `OPENCLAW_DISABLE_BONJOUR=1` для bridge networking; перевизначайте значення на `OPENCLAW_DISABLE_BONJOUR=0` лише коли багатоадресність mDNS доступна.
- `gateway.bind` у `~/.openclaw/openclaw.json` керує режимом bind для Gateway.
- `OPENCLAW_SSH_PORT` перевизначає порт SSH, коли рекламується `sshPort` (legacy: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` публікує підказку MagicDNS у TXT, коли ввімкнено повний режим mDNS (legacy: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` перевизначає рекламований шлях CLI (legacy: `OPENCLAW_CLI_PATH`).

## Пов’язана документація

- Політика виявлення та вибір транспорту: [Виявлення](/uk/gateway/discovery)
- Сполучення node + підтвердження: [Сполучення Gateway](/uk/gateway/pairing)
