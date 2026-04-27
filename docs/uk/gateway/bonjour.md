---
read_when:
    - Налагодження проблем виявлення Bonjour на macOS/iOS
    - Зміна типів сервісів mDNS, TXT-записів або UX виявлення
summary: Виявлення та налагодження Bonjour/mDNS (маяки Gateway, клієнти та поширені режими збоїв)
title: Виявлення Bonjour
x-i18n:
    generated_at: "2026-04-27T10:59:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d00812e18ffa34cd829af88acf5c52966669cf42d4f01f7ad566587b8605ded
    source_path: gateway/bonjour.md
    workflow: 15
---

# Виявлення Bonjour / mDNS

OpenClaw використовує Bonjour (mDNS / DNS‑SD), щоб виявити активний Gateway (кінцеву точку WebSocket).
Multicast-пошук у `local.` — це **зручний механізм лише для LAN**. Вбудований
плагін `bonjour` відповідає за оголошення в LAN і ввімкнений за замовчуванням. Для міжмережевого виявлення
той самий маяк також може публікуватися через налаштований wide-area домен DNS-SD.
Виявлення все одно працює за принципом best-effort і **не** замінює підключення через SSH або Tailnet.

## Wide-area Bonjour (Unicast DNS-SD) через Tailscale

Якщо Node і Gateway перебувають у різних мережах, multicast mDNS не перетне
цю межу. Ви можете зберегти той самий UX виявлення, переключившись на **unicast DNS‑SD**
("Wide‑Area Bonjour") через Tailscale.

Кроки на високому рівні:

1. Запустіть DNS-сервер на хості Gateway (доступний через Tailnet).
2. Опублікуйте записи DNS‑SD для `_openclaw-gw._tcp` у виділеній зоні
   (приклад: `openclaw.internal.`).
3. Налаштуйте в Tailscale **split DNS**, щоб вибраний домен резолвився через цей
   DNS-сервер для клієнтів (зокрема для iOS).

OpenClaw підтримує будь-який домен виявлення; `openclaw.internal.` — лише приклад.
Node на iOS/Android переглядають і `local.`, і ваш налаштований wide-area домен.

### Конфігурація Gateway (рекомендовано)

```json5
{
  gateway: { bind: "tailnet" }, // лише tailnet (рекомендовано)
  discovery: { wideArea: { enabled: true } }, // вмикає публікацію wide-area DNS-SD
}
```

### Одноразове налаштування DNS-сервера (хост Gateway)

```bash
openclaw dns setup --apply
```

Це встановлює CoreDNS і налаштовує його так, щоб він:

- слухав порт 53 лише на Tailscale-інтерфейсах Gateway
- обслуговував вибраний вами домен (приклад: `openclaw.internal.`) з `~/.openclaw/dns/<domain>.db`

Перевірте з машини, підключеної до tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Налаштування DNS у Tailscale

У консолі адміністратора Tailscale:

- Додайте nameserver, що вказує на tailnet IP Gateway (UDP/TCP 53).
- Додайте split DNS, щоб ваш домен виявлення використовував цей nameserver.

Щойно клієнти приймуть DNS tailnet, Node на iOS і виявлення через CLI зможуть переглядати
`_openclaw-gw._tcp` у вашому домені виявлення без multicast.

### Безпека слухача Gateway (рекомендовано)

Порт Gateway WS (типово `18789`) типово прив’язується до loopback. Для доступу з LAN/tailnet
вкажіть bind явно й залиште автентифікацію ввімкненою.

Для конфігурацій лише з tailnet:

- Установіть `gateway.bind: "tailnet"` у `~/.openclaw/openclaw.json`.
- Перезапустіть Gateway (або перезапустіть застосунок macOS у рядку меню).

## Що оголошується

Лише Gateway оголошує `_openclaw-gw._tcp`. Оголошення multicast у LAN
забезпечується вбудованим плагіном `bonjour`; публікація wide-area DNS-SD
залишається у власності Gateway.

## Типи сервісів

- `_openclaw-gw._tcp` — транспортний маяк gateway (використовується Node на macOS/iOS/Android).

## Ключі TXT (не секретні підказки)

Gateway оголошує невеликі не секретні підказки, щоб спростити UI-потоки:

- `role=gateway`
- `displayName=<дружня назва>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (лише коли ввімкнено TLS)
- `gatewayTlsSha256=<sha256>` (лише коли ввімкнено TLS і доступний відбиток)
- `canvasPort=<port>` (лише коли ввімкнено хост canvas; наразі це той самий `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (лише в повному режимі mDNS, необов’язкова підказка, коли доступний Tailnet)
- `sshPort=<port>` (лише в повному режимі mDNS; wide-area DNS-SD може його не включати)
- `cliPath=<path>` (лише в повному режимі mDNS; wide-area DNS-SD все одно записує його як підказку для віддаленого встановлення)

Примітки щодо безпеки:

- TXT-записи Bonjour/mDNS **неавтентифіковані**. Клієнти не повинні вважати TXT авторитетним джерелом маршрутизації.
- Клієнти повинні маршрутизуватися, використовуючи резолвлену кінцеву точку сервісу (SRV + A/AAAA). Розглядайте `lanHost`, `tailnetDns`, `gatewayPort` і `gatewayTlsSha256` лише як підказки.
- Автоматичне націлювання SSH так само має використовувати резолвлений хост сервісу, а не лише підказки з TXT.
- TLS pinning ніколи не повинен дозволяти оголошеному `gatewayTlsSha256` перевизначати раніше збережений pin.
- Node на iOS/Android мають розглядати прямі підключення на основі виявлення як **лише TLS** і вимагати явного підтвердження користувача перед довірою до відбитка при першому підключенні.

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

Якщо перегляд працює, але резолв — ні, зазвичай це означає проблему політики LAN або
резолвера mDNS.

## Налагодження в журналах Gateway

Gateway записує журнал у циклічний лог-файл (виводиться під час запуску як
`gateway log file: ...`). Шукайте рядки `bonjour:`, особливо:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Bonjour використовує системне ім’я хоста для оголошеного `.local` хоста, якщо воно є
коректною DNS-міткою. Якщо системне ім’я хоста містить пробіли, підкреслення або інший
некоректний для DNS-мітки символ, OpenClaw використовує `openclaw.local` як резервний варіант. Установіть
`OPENCLAW_MDNS_HOSTNAME=<name>` перед запуском Gateway, якщо вам потрібна
явна мітка хоста.

## Налагодження на iOS Node

iOS Node використовує `NWBrowser` для виявлення `_openclaw-gw._tcp`.

Щоб зібрати журнали:

- Налаштування → Gateway → Додатково → **Discovery Debug Logs**
- Налаштування → Gateway → Додатково → **Discovery Logs** → відтворіть проблему → **Copy**

Журнал містить переходи станів браузера та зміни в наборі результатів.

## Коли вимикати Bonjour

Вимикайте Bonjour лише тоді, коли оголошення multicast у LAN недоступне або шкідливе.
Типовий випадок — Gateway, що працює за Docker bridge networking, WSL або
мережевою політикою, яка відкидає multicast mDNS. У таких середовищах Gateway
усе ще доступний через свою опубліковану URL-адресу, SSH, Tailnet або wide-area DNS-SD,
але автоматичне виявлення в LAN працює ненадійно.

Якщо проблема пов’язана з середовищем розгортання, надавайте перевагу наявному override змінної середовища:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Це вимикає оголошення multicast у LAN без зміни конфігурації плагіна.
Це безпечно для образів Docker, service files, launch scripts і одноразового
налагодження, оскільки параметр зникає разом із середовищем.

Використовуйте конфігурацію плагіна лише тоді, коли ви навмисно хочете вимкнути
вбудований плагін виявлення LAN для цієї конфігурації OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Особливості Docker

Вбудований плагін Bonjour автоматично вимикає оголошення multicast у LAN у виявлених
контейнерах, коли `OPENCLAW_DISABLE_BONJOUR` не задано. Docker bridge networks
зазвичай не пересилають multicast mDNS (`224.0.0.251:5353`) між контейнером
і LAN, тому оголошення з контейнера рідко робить виявлення працездатним.

Важливі особливості:

- Вимкнення Bonjour не зупиняє Gateway. Воно лише зупиняє оголошення multicast у LAN.
- Вимкнення Bonjour не змінює `gateway.bind`; Docker усе ще типово використовує
  `OPENCLAW_GATEWAY_BIND=lan`, щоб опублікований порт хоста міг працювати.
- Вимкнення Bonjour не вимикає wide-area DNS-SD. Використовуйте wide-area виявлення
  або Tailnet, коли Gateway і Node не перебувають в одній LAN.
- Повторне використання того самого `OPENCLAW_CONFIG_DIR` поза Docker не зберігає
  політику автовимкнення контейнера.
- Установлюйте `OPENCLAW_DISABLE_BONJOUR=0` лише для host networking, macvlan або іншої
  мережі, де точно проходить multicast mDNS; установлюйте `1` для примусового вимкнення.

## Усунення несправностей вимкненого Bonjour

Якщо Node більше не виявляє Gateway автоматично після налаштування Docker:

1. Підтвердьте, у якому режимі працює Gateway: auto, forced-on чи forced-off:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Підтвердьте, що сам Gateway доступний через опублікований порт:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Використовуйте пряме призначення, коли Bonjour вимкнено:
   - Control UI або локальні інструменти: `http://127.0.0.1:18789`
   - Клієнти LAN: `http://<gateway-host>:18789`
   - Міжмережеві клієнти: Tailnet MagicDNS, Tailnet IP, тунель SSH або
     wide-area DNS-SD

4. Якщо ви навмисно ввімкнули Bonjour у Docker через
   `OPENCLAW_DISABLE_BONJOUR=0`, перевірте multicast із хоста:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Якщо перегляд порожній або журнали Gateway показують повторні скасування
   watchdog у ciao, поверніть `OPENCLAW_DISABLE_BONJOUR=1` і використовуйте прямий
   маршрут або маршрут через Tailnet.

## Поширені режими збоїв

- **Bonjour не працює між мережами**: використовуйте Tailnet або SSH.
- **Multicast заблоковано**: деякі Wi‑Fi-мережі вимикають mDNS.
- **Оголошувач завис у probing/announcing**: хости із заблокованим multicast,
  container bridges, WSL або зміни інтерфейсів можуть залишити оголошувач ciao у
  неоголошеному стані. OpenClaw повторює спробу кілька разів, а потім вимикає Bonjour
  для поточного процесу Gateway замість нескінченного перезапуску оголошувача.
- **Docker bridge networking**: Bonjour автоматично вимикається у виявлених контейнерах.
  Установлюйте `OPENCLAW_DISABLE_BONJOUR=0` лише для host, macvlan або іншої
  mDNS-сумісної мережі.
- **Сон / зміни інтерфейсів**: macOS може тимчасово втрачати результати mDNS; повторіть спробу.
- **Перегляд працює, але резолв — ні**: використовуйте прості імена машин (уникайте емодзі або
  розділових знаків), а потім перезапустіть Gateway. Назва екземпляра сервісу утворюється з
  імені хоста, тому надто складні назви можуть заплутувати деякі резолвери.

## Екрановані назви екземплярів (`\032`)

Bonjour/DNS‑SD часто екранує байти в назвах екземплярів сервісу як десяткові послідовності `\DDD`
(наприклад, пробіли стають `\032`).

- Це нормально на рівні протоколу.
- UI мають декодувати їх для відображення (iOS використовує `BonjourEscapes.decode`).

## Вимкнення / конфігурація

- `openclaw plugins disable bonjour` вимикає оголошення multicast у LAN шляхом вимкнення вбудованого плагіна.
- `openclaw plugins enable bonjour` відновлює типовий плагін виявлення LAN.
- `OPENCLAW_DISABLE_BONJOUR=1` вимикає оголошення multicast у LAN без зміни конфігурації плагіна; приймаються truthy-значення `1`, `true`, `yes` і `on` (застаріле: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` примусово вмикає оголошення multicast у LAN, зокрема у виявлених контейнерах; приймаються falsy-значення `0`, `false`, `no` і `off`.
- Коли `OPENCLAW_DISABLE_BONJOUR` не задано, Bonjour оголошується на звичайних хостах і автоматично вимикається у виявлених контейнерах.
- `gateway.bind` у `~/.openclaw/openclaw.json` керує режимом bind для Gateway.
- `OPENCLAW_SSH_PORT` перевизначає SSH-порт, коли оголошується `sshPort` (застаріле: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` публікує підказку MagicDNS у TXT, коли ввімкнено повний режим mDNS (застаріле: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` перевизначає оголошений шлях CLI (застаріле: `OPENCLAW_CLI_PATH`).

## Пов’язана документація

- Політика виявлення та вибір транспорту: [Виявлення](/uk/gateway/discovery)
- Pairing і підтвердження Node: [Pairing Gateway](/uk/gateway/pairing)
