---
read_when:
    - Налагодження проблем із виявленням Bonjour на macOS/iOS
    - Зміна типів служб mDNS, TXT-записів або UX виявлення
summary: Виявлення Bonjour/mDNS + налагодження (маячки Gateway, клієнти та поширені сценарії збоїв)
title: Виявлення Bonjour
x-i18n:
    generated_at: "2026-05-06T03:01:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7b7d029e6eb6bee90eb96e7ea169ecadf3bda6d969b2450349c5716a950e205
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw може використовувати Bonjour (mDNS / DNS-SD), щоб виявляти активний Gateway (кінцева точка WebSocket).
Перегляд multicast `local.` — це **зручність лише для LAN**. Вбудований Plugin `bonjour`
відповідає за LAN-анонсування. Він запускається автоматично на хостах macOS і потребує явного ввімкнення на
Linux, Windows і контейнеризованих розгортаннях Gateway. Для виявлення між мережами той самий
beacon також можна опублікувати через налаштований wide-area домен DNS-SD. Виявлення
все ще працює за принципом best-effort і **не** замінює підключення через SSH або на основі Tailnet.

## Wide-area Bonjour (Unicast DNS-SD) через Tailscale

Якщо вузол і gateway перебувають у різних мережах, multicast mDNS не перетне
межу. Можна зберегти той самий UX виявлення, перемкнувшись на **unicast DNS-SD**
("Wide-Area Bonjour") через Tailscale.

Кроки на високому рівні:

1. Запустіть DNS-сервер на хості gateway (доступному через Tailnet).
2. Опублікуйте записи DNS-SD для `_openclaw-gw._tcp` у виділеній зоні
   (приклад: `openclaw.internal.`).
3. Налаштуйте **split DNS** Tailscale, щоб вибраний домен розв’язувався через цей
   DNS-сервер для клієнтів (зокрема iOS).

OpenClaw підтримує будь-який домен виявлення; `openclaw.internal.` — лише приклад.
Вузли iOS/Android переглядають і `local.`, і ваш налаштований wide-area домен.

### Конфігурація Gateway (рекомендовано)

```json5
{
  gateway: { bind: "tailnet" }, // лише tailnet (рекомендовано)
  discovery: { wideArea: { enabled: true } }, // вмикає wide-area публікацію DNS-SD
}
```

### Одноразове налаштування DNS-сервера (хост gateway)

```bash
openclaw dns setup --apply
```

Це встановлює CoreDNS і налаштовує його так, щоб він:

- слухав порт 53 лише на інтерфейсах Tailscale gateway
- обслуговував вибраний домен (приклад: `openclaw.internal.`) з `~/.openclaw/dns/<domain>.db`

Перевірте з машини, підключеної до tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Налаштування DNS Tailscale

У консолі адміністратора Tailscale:

- Додайте nameserver, що вказує на tailnet IP gateway (UDP/TCP 53).
- Додайте split DNS, щоб ваш домен виявлення використовував цей nameserver.

Коли клієнти приймуть tailnet DNS, вузли iOS і виявлення CLI зможуть переглядати
`_openclaw-gw._tcp` у вашому домені виявлення без multicast.

### Безпека слухача Gateway (рекомендовано)

Порт WS Gateway (за замовчуванням `18789`) типово прив’язується до loopback. Для доступу через LAN/tailnet
явно задайте прив’язку та залиште автентифікацію ввімкненою.

Для налаштувань лише tailnet:

- Задайте `gateway.bind: "tailnet"` у `~/.openclaw/openclaw.json`.
- Перезапустіть Gateway (або перезапустіть застосунок у рядку меню macOS).

## Що анонсується

Лише Gateway анонсує `_openclaw-gw._tcp`. LAN multicast-анонсування
забезпечує вбудований Plugin `bonjour`, коли Plugin увімкнено; wide-area
публікація DNS-SD залишається відповідальністю Gateway.

## Типи сервісів

- `_openclaw-gw._tcp` - beacon транспорту gateway (використовується вузлами macOS/iOS/Android).

## Ключі TXT (несекретні підказки)

Gateway анонсує невеликі несекретні підказки, щоб зробити UI-потоки зручними:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (лише коли TLS увімкнено)
- `gatewayTlsSha256=<sha256>` (лише коли TLS увімкнено й fingerprint доступний)
- `canvasPort=<port>` (лише коли хост canvas увімкнено; наразі те саме, що й `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (лише повний режим mDNS, необов’язкова підказка, коли Tailnet доступний)
- `sshPort=<port>` (лише повний режим mDNS; wide-area DNS-SD може його пропускати)
- `cliPath=<path>` (лише повний режим mDNS; wide-area DNS-SD усе одно записує його як підказку для віддаленого встановлення)

Примітки щодо безпеки:

- TXT-записи Bonjour/mDNS **не автентифіковані**. Клієнти не повинні вважати TXT авторитетним джерелом маршрутизації.
- Клієнти мають маршрутизувати через розв’язану кінцеву точку сервісу (SRV + A/AAAA). Вважайте `lanHost`, `tailnetDns`, `gatewayPort` і `gatewayTlsSha256` лише підказками.
- Автоматичне визначення цілі SSH так само має використовувати розв’язаний хост сервісу, а не підказки лише з TXT.
- TLS pinning ніколи не має дозволяти анонсованому `gatewayTlsSha256` перевизначати раніше збережений pin.
- Вузли iOS/Android мають вважати прямі підключення на основі виявлення **лише TLS** і вимагати явного підтвердження користувача перед довірою до fingerprint уперше.

## Налагодження на macOS

Корисні вбудовані інструменти:

- Переглянути екземпляри:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Розв’язати один екземпляр (замініть `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Якщо перегляд працює, а розв’язання ні, зазвичай причина в політиці LAN або
проблемі resolver mDNS.

## Налагодження в журналах Gateway

Gateway записує rolling log file (друкується під час запуску як
`gateway log file: ...`). Шукайте рядки `bonjour:`, особливо:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Bonjour використовує системне ім’я хоста для анонсованого хоста `.local`, коли воно є
дійсною DNS-міткою. Якщо системне ім’я хоста містить пробіли, підкреслення або інший
недійсний символ DNS-мітки, OpenClaw повертається до `openclaw.local`. Задайте
`OPENCLAW_MDNS_HOSTNAME=<name>` перед запуском Gateway, коли потрібна
явна мітка хоста.

## Налагодження на вузлі iOS

Вузол iOS використовує `NWBrowser` для виявлення `_openclaw-gw._tcp`.

Щоб зібрати журнали:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → відтворіть → **Copy**

Журнал містить переходи станів браузера та зміни набору результатів.

## Коли вмикати Bonjour

Bonjour автоматично запускається для старту Gateway з порожньою конфігурацією на хостах macOS, оскільки
локальний застосунок і сусідні вузли iOS/Android часто покладаються на виявлення в тій самій LAN.

Увімкніть Bonjour явно, коли автоматичне виявлення в тій самій LAN корисне на Linux,
Windows або іншому хості не macOS:

```bash
openclaw plugins enable bonjour
```

Коли Bonjour увімкнено, він використовує `discovery.mdns.mode`, щоб вирішити, скільки TXT-метаданих
публікувати. Режим за замовчуванням — `minimal`; використовуйте `full` лише коли локальним клієнтам потрібні
підказки `cliPath` або `sshPort`, і використовуйте `off`, щоб придушити LAN multicast без
зміни ввімкнення Plugin.

## Коли вимикати Bonjour

Залишайте Bonjour вимкненим, коли LAN multicast-анонсування непотрібне, недоступне
або шкідливе. Типові випадки — сервери не macOS, мережі Docker bridge,
WSL або мережева політика, що відкидає mDNS multicast. У цих середовищах
Gateway усе ще доступний через опублікований URL, SSH, Tailnet або wide-area
DNS-SD, але LAN auto-discovery ненадійне.

Надавайте перевагу наявному перевизначенню через середовище, коли проблема обмежена розгортанням:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Це вимикає LAN multicast-анонсування без зміни конфігурації Plugin.
Це безпечно для образів Docker, service files, launch scripts і одноразового
налагодження, оскільки налаштування зникає разом із середовищем.

Використовуйте конфігурацію Plugin, коли навмисно хочете вимкнути вбудований LAN
discovery Plugin для цієї конфігурації OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Особливості Docker

Вбудований Plugin Bonjour автоматично вимикає LAN multicast-анонсування у виявлених
контейнерах, коли `OPENCLAW_DISABLE_BONJOUR` не задано. Мережі Docker bridge
зазвичай не пересилають mDNS multicast (`224.0.0.251:5353`) між контейнером
і LAN, тому анонсування з контейнера рідко забезпечує роботу виявлення.

Важливі особливості:

- Bonjour автоматично запускається на хостах macOS і потребує явного ввімкнення в інших місцях. Якщо залишити його
  вимкненим, це не зупиняє Gateway; це лише пропускає LAN multicast-анонсування.
- Вимкнення Bonjour не змінює `gateway.bind`; Docker усе ще типово використовує
  `OPENCLAW_GATEWAY_BIND=lan`, щоб опублікований порт хоста міг працювати.
- Вимкнення Bonjour не вимикає wide-area DNS-SD. Використовуйте wide-area discovery
  або Tailnet, коли Gateway і вузол не в одній LAN.
- Повторне використання того самого `OPENCLAW_CONFIG_DIR` поза Docker не зберігає
  політику автоматичного вимкнення контейнера.
- Задавайте `OPENCLAW_DISABLE_BONJOUR=0` лише для host networking, macvlan або іншої
  мережі, де mDNS multicast гарантовано проходить; задайте `1`, щоб примусово вимкнути.

## Усунення несправностей вимкненого Bonjour

Якщо вузол більше не виявляє Gateway автоматично після налаштування Docker:

1. Підтвердьте, у якому режимі працює Gateway: auto, forced-on чи forced-off:

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
   - Клієнти між мережами: Tailnet MagicDNS, Tailnet IP, SSH tunnel або
     wide-area DNS-SD

4. Якщо ви навмисно ввімкнули Plugin Bonjour у Docker і примусово ввімкнули анонсування
   через `OPENCLAW_DISABLE_BONJOUR=0`, протестуйте multicast з хоста:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Якщо перегляд порожній або журнали Gateway показують повторювані скасування
   ciao watchdog, відновіть `OPENCLAW_DISABLE_BONJOUR=1` і використовуйте прямий або
   Tailnet-маршрут.

## Поширені режими відмов

- **Bonjour не працює між мережами**: використовуйте Tailnet або SSH.
- **Multicast заблоковано**: деякі Wi-Fi мережі вимикають mDNS.
- **Advertiser застряг у probing/announcing**: хости із заблокованим multicast,
  container bridges, WSL або зміни інтерфейсів можуть залишити ciao advertiser у
  неанонсованому стані. OpenClaw повторює спроби кілька разів, а потім вимикає Bonjour
  для поточного процесу Gateway замість нескінченного перезапуску advertiser.
- **Мережа Docker bridge**: Bonjour автоматично вимикається у виявлених контейнерах.
  Задавайте `OPENCLAW_DISABLE_BONJOUR=0` лише для host, macvlan або іншої
  mDNS-сумісної мережі.
- **Сон / зміни інтерфейсів**: macOS може тимчасово втрачати результати mDNS; повторіть спробу.
- **Перегляд працює, але розв’язання ні**: тримайте імена машин простими (уникайте emoji або
  пунктуації), потім перезапустіть Gateway. Ім’я екземпляра сервісу походить від
  імені хоста, тому надто складні імена можуть заплутувати деякі resolver.

## Екрановані імена екземплярів (`\032`)

Bonjour/DNS-SD часто екранує байти в іменах екземплярів сервісів як десяткові
послідовності `\DDD` (наприклад, пробіли стають `\032`).

- Це нормально на рівні протоколу.
- UI мають декодувати для відображення (iOS використовує `BonjourEscapes.decode`).

## Увімкнення / вимкнення / конфігурація

- Хости macOS автоматично запускають вбудований LAN discovery Plugin за замовчуванням.
- `openclaw plugins enable bonjour` вмикає вбудований LAN discovery Plugin на хостах, де він не ввімкнений за замовчуванням.
- `openclaw plugins disable bonjour` вимикає LAN multicast-анонсування, вимикаючи вбудований Plugin.
- `OPENCLAW_DISABLE_BONJOUR=1` вимикає LAN multicast-анонсування без зміни конфігурації Plugin; прийняті truthy-значення: `1`, `true`, `yes` і `on` (застаріле: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` примусово вмикає LAN multicast-анонсування, зокрема всередині виявлених контейнерів; прийняті falsy-значення: `0`, `false`, `no` і `off`.
- Коли Plugin Bonjour увімкнено і `OPENCLAW_DISABLE_BONJOUR` не задано, Bonjour анонсується на звичайних хостах і автоматично вимикається всередині виявлених контейнерів.
- `gateway.bind` у `~/.openclaw/openclaw.json` керує режимом прив’язки Gateway.
- `OPENCLAW_SSH_PORT` перевизначає порт SSH, коли `sshPort` анонсується (застаріле: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` публікує підказку MagicDNS у TXT, коли ввімкнено повний режим mDNS (застаріле: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` перевизначає анонсований шлях CLI (застаріле: `OPENCLAW_CLI_PATH`).

## Пов’язані документи

- Політика виявлення та вибір транспорту: [Discovery](/uk/gateway/discovery)
- Сполучення вузлів + підтвердження: [Gateway pairing](/uk/gateway/pairing)
