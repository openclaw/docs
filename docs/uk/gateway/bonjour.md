---
read_when:
    - Налагодження проблем із виявленням Bonjour у macOS/iOS
    - Зміна типів сервісів mDNS, записів TXT або UX виявлення
summary: Виявлення Bonjour/mDNS + налагодження (маяки Gateway, клієнти та поширені режими збоїв)
title: Виявлення Bonjour
x-i18n:
    generated_at: "2026-05-03T18:20:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2975fea03bc8fe8ccbd57f7a4ca8c15a59fb21b3f92c2b77b9a57ae4ebd5d374
    source_path: gateway/bonjour.md
    workflow: 16
---

# Виявлення Bonjour / mDNS

OpenClaw може використовувати Bonjour (mDNS / DNS-SD), щоб виявляти активний Gateway (кінцеву точку WebSocket).
Перегляд multicast `local.` є **зручністю лише для LAN**. Вбудований plugin `bonjour`
відповідає за LAN-анонсування. Він автоматично запускається на хостах macOS і вмикається явно на
Linux, Windows та контейнеризованих розгортаннях Gateway. Для виявлення між мережами той самий
маяк також можна публікувати через налаштований домен wide-area DNS-SD. Виявлення
все одно працює за принципом найкращої спроби й **не** замінює підключення через SSH або на основі Tailnet.

## Wide-area Bonjour (Unicast DNS-SD) через Tailscale

Якщо node і Gateway перебувають у різних мережах, multicast mDNS не перетне
межу. Ви можете зберегти той самий UX виявлення, перейшовши на **unicast DNS‑SD**
("Wide‑Area Bonjour") через Tailscale.

Загальні кроки:

1. Запустіть DNS-сервер на хості Gateway (доступний через Tailnet).
2. Опублікуйте записи DNS‑SD для `_openclaw-gw._tcp` у межах виділеної зони
   (приклад: `openclaw.internal.`).
3. Налаштуйте **split DNS** у Tailscale, щоб вибраний домен розв’язувався через цей
   DNS-сервер для клієнтів (включно з iOS).

OpenClaw підтримує будь-який домен виявлення; `openclaw.internal.` — лише приклад.
Node на iOS/Android переглядають і `local.`, і ваш налаштований wide-area домен.

### Конфігурація Gateway (рекомендовано)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
}
```

### Одноразове налаштування DNS-сервера (хост Gateway)

```bash
openclaw dns setup --apply
```

Це встановлює CoreDNS і налаштовує його так, щоб він:

- слухав порт 53 лише на інтерфейсах Tailscale Gateway
- обслуговував вибраний домен (приклад: `openclaw.internal.`) з `~/.openclaw/dns/<domain>.db`

Перевірте з машини, підключеної до Tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Налаштування DNS у Tailscale

У консолі адміністратора Tailscale:

- Додайте nameserver, що вказує на tailnet IP Gateway (UDP/TCP 53).
- Додайте split DNS, щоб ваш домен виявлення використовував цей nameserver.

Щойно клієнти приймуть DNS Tailnet, node на iOS і виявлення CLI зможуть переглядати
`_openclaw-gw._tcp` у вашому домені виявлення без multicast.

### Безпека слухача Gateway (рекомендовано)

Порт WS Gateway (типово `18789`) за замовчуванням прив’язується до loopback. Для доступу через LAN/tailnet
явно задайте bind і залиште автентифікацію ввімкненою.

Для конфігурацій лише через tailnet:

- Установіть `gateway.bind: "tailnet"` у `~/.openclaw/openclaw.json`.
- Перезапустіть Gateway (або перезапустіть застосунок у рядку меню macOS).

## Що анонсується

Лише Gateway анонсує `_openclaw-gw._tcp`. LAN multicast-анонсування
надає вбудований Plugin `bonjour`, коли Plugin увімкнений; wide-area
публікація DNS-SD залишається у власності Gateway.

## Типи сервісів

- `_openclaw-gw._tcp` — маяк транспорту Gateway (використовується node на macOS/iOS/Android).

## Ключі TXT (несекретні підказки)

Gateway анонсує невеликі несекретні підказки, щоб зробити UI-потоки зручними:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (лише коли TLS увімкнено)
- `gatewayTlsSha256=<sha256>` (лише коли TLS увімкнено й fingerprint доступний)
- `canvasPort=<port>` (лише коли canvas host увімкнено; наразі збігається з `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (лише повний режим mDNS, необов’язкова підказка, коли Tailnet доступний)
- `sshPort=<port>` (лише повний режим mDNS; wide-area DNS-SD може його пропускати)
- `cliPath=<path>` (лише повний режим mDNS; wide-area DNS-SD все одно записує його як підказку для віддаленого встановлення)

Нотатки щодо безпеки:

- Записи TXT Bonjour/mDNS **не автентифіковані**. Клієнти не мають вважати TXT авторитетним джерелом маршрутизації.
- Клієнти мають маршрутизувати через розв’язану кінцеву точку сервісу (SRV + A/AAAA). Вважайте `lanHost`, `tailnetDns`, `gatewayPort` і `gatewayTlsSha256` лише підказками.
- Автовибір цілі для SSH так само має використовувати розв’язаний хост сервісу, а не лише підказки TXT.
- TLS pinning ніколи не має дозволяти анонсованому `gatewayTlsSha256` перезаписувати раніше збережений pin.
- Node на iOS/Android мають вважати прямі підключення на основі виявлення **лише TLS** і вимагати явного підтвердження користувача перед довірою до fingerprint уперше.

## Налагодження на macOS

Корисні вбудовані інструменти:

- Перегляд екземплярів:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Розв’язання одного екземпляра (замініть `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Якщо перегляд працює, але розв’язання не вдається, зазвичай причина в політиці LAN або
проблемі резолвера mDNS.

## Налагодження в журналах Gateway

Gateway записує rolling log-файл (виводиться під час запуску як
`gateway log file: ...`). Шукайте рядки `bonjour:`, особливо:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Bonjour використовує системне ім’я хоста для анонсованого хоста `.local`, коли воно є
дійсною DNS-міткою. Якщо системне ім’я хоста містить пробіли, підкреслення або інший
недійсний символ DNS-мітки, OpenClaw відступає до `openclaw.local`. Установіть
`OPENCLAW_MDNS_HOSTNAME=<name>` перед запуском Gateway, коли потрібна
явна мітка хоста.

## Налагодження на node iOS

Node iOS використовує `NWBrowser`, щоб виявляти `_openclaw-gw._tcp`.

Щоб зібрати журнали:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → відтворіть → **Copy**

Журнал містить переходи стану browser і зміни набору результатів.

## Коли вмикати Bonjour

Bonjour автоматично запускається для старту Gateway з порожньою конфігурацією на хостах macOS, оскільки
локальний застосунок і сусідні node iOS/Android часто покладаються на виявлення в тій самій LAN.

Явно вмикайте Bonjour, коли автовиявлення в тій самій LAN корисне на Linux,
Windows або іншому хості не macOS:

```bash
openclaw plugins enable bonjour
```

Коли Bonjour увімкнено, він використовує `discovery.mdns.mode`, щоб вирішити, скільки метаданих TXT
публікувати. Типовий режим — `minimal`; використовуйте `full` лише тоді, коли локальним клієнтам потрібні
підказки `cliPath` або `sshPort`, і використовуйте `off`, щоб придушити LAN multicast без
зміни ввімкнення Plugin.

## Коли вимикати Bonjour

Залишайте Bonjour вимкненим, коли LAN multicast-анонсування непотрібне, недоступне
або шкідливе. Типові випадки — сервери не macOS, мережа Docker bridge,
WSL або мережева політика, що відкидає multicast mDNS. У цих середовищах
Gateway усе ще доступний через опублікований URL, SSH, Tailnet або wide-area
DNS-SD, але LAN-автовиявлення ненадійне.

Віддавайте перевагу наявному перевизначенню середовища, коли проблема стосується розгортання:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Це вимикає LAN multicast-анонсування без зміни конфігурації Plugin.
Це безпечно для образів Docker, service-файлів, launch-скриптів і одноразового
налагодження, оскільки налаштування зникає разом із середовищем.

Використовуйте конфігурацію Plugin, коли навмисно хочете вимкнути вбудований Plugin
виявлення LAN для цієї конфігурації OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Підводні камені Docker

Вбудований Plugin Bonjour автоматично вимикає LAN multicast-анонсування у виявлених
контейнерах, коли `OPENCLAW_DISABLE_BONJOUR` не встановлено. Мережі Docker bridge
зазвичай не пересилають multicast mDNS (`224.0.0.251:5353`) між контейнером
і LAN, тому анонсування з контейнера рідко робить виявлення працездатним.

Важливі підводні камені:

- Bonjour автоматично запускається на хостах macOS і вмикається явно в інших місцях. Якщо залишити його
  вимкненим, це не зупиняє Gateway; це лише пропускає LAN multicast-анонсування.
- Вимкнення Bonjour не змінює `gateway.bind`; Docker усе ще типово використовує
  `OPENCLAW_GATEWAY_BIND=lan`, щоб опублікований порт хоста міг працювати.
- Вимкнення Bonjour не вимикає wide-area DNS-SD. Використовуйте wide-area виявлення
  або Tailnet, коли Gateway і node не в одній LAN.
- Повторне використання того самого `OPENCLAW_CONFIG_DIR` поза Docker не зберігає
  політику автовимкнення контейнера.
- Установлюйте `OPENCLAW_DISABLE_BONJOUR=0` лише для host networking, macvlan або іншої
  мережі, де multicast mDNS відомо проходить; установіть його в `1`, щоб примусово вимкнути.

## Усунення несправностей вимкненого Bonjour

Якщо node більше не виявляє Gateway автоматично після налаштування Docker:

1. Підтвердьте, чи Gateway працює в режимі auto, forced-on або forced-off:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Підтвердьте, що сам Gateway доступний через опублікований порт:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Використовуйте пряму ціль, коли Bonjour вимкнено:
   - Control UI або локальні інструменти: `http://127.0.0.1:18789`
   - Клієнти LAN: `http://<gateway-host>:18789`
   - Клієнти між мережами: Tailnet MagicDNS, Tailnet IP, SSH-тунель або
     wide-area DNS-SD

4. Якщо ви навмисно ввімкнули Plugin Bonjour у Docker і примусово ввімкнули анонсування
   через `OPENCLAW_DISABLE_BONJOUR=0`, протестуйте multicast з хоста:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Якщо перегляд порожній або журнали Gateway показують повторювані скасування
   watchdog ciao, відновіть `OPENCLAW_DISABLE_BONJOUR=1` і використовуйте прямий
   або Tailnet-маршрут.

## Поширені режими відмов

- **Bonjour не перетинає мережі**: використовуйте Tailnet або SSH.
- **Multicast заблоковано**: деякі Wi‑Fi мережі вимикають mDNS.
- **Анонсер застряг у probing/announcing**: хости із заблокованим multicast,
  container bridge, WSL або зміни інтерфейсів можуть залишити анонсер ciao в
  неанонсованому стані. OpenClaw повторює спробу кілька разів, а потім вимикає Bonjour
  для поточного процесу Gateway замість нескінченного перезапуску анонсера.
- **Мережа Docker bridge**: Bonjour автоматично вимикається у виявлених контейнерах.
  Установлюйте `OPENCLAW_DISABLE_BONJOUR=0` лише для host, macvlan або іншої
  мережі з підтримкою mDNS.
- **Сон / зміни інтерфейсів**: macOS може тимчасово втрачати результати mDNS; повторіть спробу.
- **Перегляд працює, але розв’язання не вдається**: тримайте імена машин простими (уникайте emoji або
  розділових знаків), потім перезапустіть Gateway. Ім’я екземпляра сервісу походить від
  імені хоста, тому надто складні імена можуть збивати з пантелику деякі резолвери.

## Екрановані імена екземплярів (`\032`)

Bonjour/DNS‑SD часто екранує байти в іменах екземплярів сервісів як десяткові послідовності `\DDD`
(наприклад, пробіли стають `\032`).

- Це нормально на рівні протоколу.
- UI мають декодувати для відображення (iOS використовує `BonjourEscapes.decode`).

## Увімкнення / вимкнення / конфігурація

- Хости macOS типово автоматично запускають вбудований Plugin виявлення LAN.
- `openclaw plugins enable bonjour` вмикає вбудований Plugin виявлення LAN на хостах, де він не ввімкнений типово.
- `openclaw plugins disable bonjour` вимикає LAN multicast-анонсування, вимикаючи вбудований Plugin.
- `OPENCLAW_DISABLE_BONJOUR=1` вимикає LAN multicast-анонсування без зміни конфігурації Plugin; прийняті truthy-значення: `1`, `true`, `yes` і `on` (застаріле: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` примусово вмикає LAN multicast-анонсування, зокрема всередині виявлених контейнерів; прийняті falsy-значення: `0`, `false`, `no` і `off`.
- Коли Plugin Bonjour увімкнено, а `OPENCLAW_DISABLE_BONJOUR` не встановлено, Bonjour анонсує на звичайних хостах і автоматично вимикається всередині виявлених контейнерів.
- `gateway.bind` у `~/.openclaw/openclaw.json` керує режимом bind Gateway.
- `OPENCLAW_SSH_PORT` перевизначає порт SSH, коли `sshPort` анонсується (застаріле: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` публікує підказку MagicDNS у TXT, коли ввімкнено повний режим mDNS (застаріле: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` перевизначає анонсований шлях CLI (застаріле: `OPENCLAW_CLI_PATH`).

## Пов’язані документи

- Політика виявлення та вибір транспорту: [Виявлення](/uk/gateway/discovery)
- Спарювання node + схвалення: [Спарювання Gateway](/uk/gateway/pairing)
