---
read_when:
    - Налагодження проблем із виявленням Bonjour на macOS/iOS
    - Зміна типів служб mDNS, записів TXT або користувацького досвіду виявлення
summary: Виявлення Bonjour/mDNS + налагодження (маяки Gateway, клієнти та поширені режими відмови)
title: Виявлення Bonjour
x-i18n:
    generated_at: "2026-05-11T20:35:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03bd9403591a389c06d3131e4c110d4ccf711eee56cbe9a5c9baed2b6df8fb80
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw може використовувати Bonjour (mDNS / DNS-SD), щоб виявляти активний Gateway (кінцеву точку WebSocket).
Перегляд multicast `local.` — це **зручність лише для LAN**. Вбудований плагін `bonjour`
відповідає за LAN-оголошення. Він автоматично запускається на хостах macOS і вмикається вручну в
Linux, Windows та контейнеризованих розгортаннях Gateway. Для виявлення між мережами цей самий
beacon також можна опублікувати через налаштований домен wide-area DNS-SD. Виявлення
все одно працює за принципом best-effort і **не** замінює SSH або підключення на основі Tailnet.

## Wide-area Bonjour (Unicast DNS-SD) через Tailscale

Якщо вузол і gateway перебувають у різних мережах, multicast mDNS не перетне
межу. Можна зберегти той самий UX виявлення, перемкнувшись на **unicast DNS-SD**
("Wide-Area Bonjour") через Tailscale.

Загальні кроки:

1. Запустіть DNS-сервер на хості gateway (доступний через Tailnet).
2. Опублікуйте DNS-SD записи для `_openclaw-gw._tcp` у виділеній зоні
   (приклад: `openclaw.internal.`).
3. Налаштуйте **split DNS** у Tailscale, щоб вибраний домен розв'язувався через цей
   DNS-сервер для клієнтів (зокрема iOS).

OpenClaw підтримує будь-який домен виявлення; `openclaw.internal.` — лише приклад.
Вузли iOS/Android переглядають і `local.`, і ваш налаштований wide-area домен.

### Конфігурація Gateway (рекомендовано)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
}
```

### Одноразове налаштування DNS-сервера (хост gateway)

```bash
openclaw dns setup --apply
```

Це встановлює CoreDNS і налаштовує його так, щоб він:

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

Після того як клієнти приймуть tailnet DNS, вузли iOS і CLI-виявлення зможуть переглядати
`_openclaw-gw._tcp` у вашому домені виявлення без multicast.

### Безпека слухача Gateway (рекомендовано)

Порт Gateway WS (типово `18789`) за замовчуванням прив'язується до loopback. Для доступу через LAN/tailnet
прив'яжіть його явно й залиште автентифікацію ввімкненою.

Для налаштувань лише через tailnet:

- Установіть `gateway.bind: "tailnet"` у `~/.openclaw/openclaw.json`.
- Перезапустіть Gateway (або перезапустіть застосунок у рядку меню macOS).

## Що оголошується

Лише Gateway оголошує `_openclaw-gw._tcp`. LAN multicast-оголошення
забезпечує вбудований плагін `bonjour`, коли плагін увімкнено; wide-area
публікація DNS-SD залишається у власності Gateway.

## Типи служб

- `_openclaw-gw._tcp` - beacon транспорту gateway (використовується вузлами macOS/iOS/Android).

## TXT-ключі (несекретні підказки)

Gateway оголошує невеликі несекретні підказки, щоб зробити UI-потоки зручнішими:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (лише коли TLS увімкнено)
- `gatewayTlsSha256=<sha256>` (лише коли TLS увімкнено й відбиток доступний)
- `canvasPort=<port>` (лише коли хост canvas увімкнено; наразі такий самий, як `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (лише повний режим mDNS, необов'язкова підказка, коли Tailnet доступний)
- `sshPort=<port>` (лише повний режим mDNS; wide-area DNS-SD може його пропускати)
- `cliPath=<path>` (лише повний режим mDNS; wide-area DNS-SD все одно записує його як підказку для віддаленого встановлення)

Примітки щодо безпеки:

- TXT-записи Bonjour/mDNS **не автентифіковані**. Клієнти не повинні вважати TXT авторитетним джерелом маршрутизації.
- Клієнти мають маршрутизуватися за допомогою розв'язаної кінцевої точки служби (SRV + A/AAAA). Вважайте `lanHost`, `tailnetDns`, `gatewayPort` і `gatewayTlsSha256` лише підказками.
- Автоматичний вибір цілі SSH так само має використовувати розв'язаний хост служби, а не підказки лише з TXT.
- TLS pinning ніколи не має дозволяти оголошеному `gatewayTlsSha256` перевизначати раніше збережений pin.
- Вузли iOS/Android мають вважати прямі підключення на основі виявлення **лише TLS** і вимагати явного підтвердження користувача перед довірою до першого відбитка.

## Налагодження на macOS

Корисні вбудовані інструменти:

- Переглянути екземпляри:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Розв'язати один екземпляр (замініть `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Якщо перегляд працює, але розв'язання не вдається, зазвичай причина в політиці LAN або
проблемі resolver mDNS.

## Налагодження в логах Gateway

Gateway записує ротаційний файл журналу (друкується під час запуску як
`gateway log file: ...`). Шукайте рядки `bonjour:`, особливо:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Watchdog розглядає активні `probing`, `announcing` і свіжі перейменування через конфлікт як
стани в процесі виконання. Якщо служба ніколи не досягає `announced`, OpenClaw зрештою
перестворює advertiser і, після повторних помилок, вимикає Bonjour для цього
процесу Gateway замість нескінченного повторного оголошення.

Bonjour використовує системне ім'я хоста для оголошеного хоста `.local`, коли воно є
валідною DNS-міткою. Якщо системне ім'я хоста містить пробіли, підкреслення або інший
недійсний символ DNS-мітки, OpenClaw повертається до `openclaw.local`. Установіть
`OPENCLAW_MDNS_HOSTNAME=<name>` перед запуском Gateway, коли потрібна явна
мітка хоста.

## Налагодження на вузлі iOS

Вузол iOS використовує `NWBrowser` для виявлення `_openclaw-gw._tcp`.

Щоб зібрати логи:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → відтворіть проблему → **Copy**

Лог містить переходи станів browser і зміни набору результатів.

## Коли вмикати Bonjour

Bonjour автоматично запускається для запуску Gateway з порожньою конфігурацією на хостах macOS, бо
локальний застосунок і близькі вузли iOS/Android часто покладаються на виявлення в тій самій LAN.

Увімкніть Bonjour явно, коли автоматичне виявлення в тій самій LAN корисне в Linux,
Windows або на іншому хості не macOS:

```bash
openclaw plugins enable bonjour
```

Коли ввімкнено, Bonjour використовує `discovery.mdns.mode`, щоб визначити, скільки TXT-метаданих
публікувати. Типовий режим — `minimal`; використовуйте `full` лише коли локальним клієнтам потрібні
підказки `cliPath` або `sshPort`, і використовуйте `off`, щоб придушити LAN multicast без
зміни ввімкнення плагіна.

## Коли вимикати Bonjour

Залишайте Bonjour вимкненим, коли LAN multicast-оголошення непотрібне, недоступне
або шкідливе. Поширені випадки — сервери не macOS, мережа Docker bridge,
WSL або мережева політика, яка відкидає mDNS multicast. У цих середовищах
Gateway усе ще доступний через опублікований URL, SSH, Tailnet або wide-area
DNS-SD, але LAN-автовиявлення ненадійне.

Віддавайте перевагу наявному перевизначенню середовища, коли проблема залежить від розгортання:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Це вимикає LAN multicast-оголошення без зміни конфігурації плагіна.
Це безпечно для Docker-образів, service-файлів, скриптів запуску й одноразового
налагодження, бо налаштування зникає разом із середовищем.

Використовуйте конфігурацію плагіна, коли ви навмисно хочете вимкнути вбудований LAN
плагін виявлення для цієї конфігурації OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Підводні камені Docker

Вбудований плагін Bonjour автоматично вимикає LAN multicast-оголошення у виявлених
контейнерах, коли `OPENCLAW_DISABLE_BONJOUR` не задано. Мережі Docker bridge
зазвичай не пересилають mDNS multicast (`224.0.0.251:5353`) між контейнером
і LAN, тому оголошення з контейнера рідко забезпечує роботу виявлення.

Важливі підводні камені:

- Bonjour автоматично запускається на хостах macOS і вмикається вручну в інших середовищах. Якщо залишити його
  вимкненим, Gateway не зупиниться; це лише пропускає LAN multicast-оголошення.
- Вимкнення Bonjour не змінює `gateway.bind`; Docker усе ще типово використовує
  `OPENCLAW_GATEWAY_BIND=lan`, щоб опублікований порт хоста міг працювати.
- Вимкнення Bonjour не вимикає wide-area DNS-SD. Використовуйте wide-area виявлення
  або Tailnet, коли Gateway і вузол не в одній LAN.
- Повторне використання того самого `OPENCLAW_CONFIG_DIR` поза Docker не зберігає
  політику автоматичного вимкнення контейнера.
- Установлюйте `OPENCLAW_DISABLE_BONJOUR=0` лише для host networking, macvlan або іншої
  мережі, де mDNS multicast гарантовано проходить; установіть `1`, щоб примусово вимкнути.

## Усунення несправностей вимкненого Bonjour

Якщо вузол більше не автовиявляє Gateway після налаштування Docker:

1. Перевірте, чи Gateway працює в режимі auto, forced-on або forced-off:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Перевірте, що сам Gateway доступний через опублікований порт:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Використовуйте пряму ціль, коли Bonjour вимкнено:
   - Control UI або локальні інструменти: `http://127.0.0.1:18789`
   - LAN-клієнти: `http://<gateway-host>:18789`
   - Клієнти між мережами: Tailnet MagicDNS, Tailnet IP, SSH-тунель або
     wide-area DNS-SD

4. Якщо ви навмисно ввімкнули плагін Bonjour у Docker і примусово ввімкнули оголошення
   через `OPENCLAW_DISABLE_BONJOUR=0`, протестуйте multicast з хоста:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Якщо перегляд порожній або логи Gateway показують повторні скасування ciao watchdog,
   відновіть `OPENCLAW_DISABLE_BONJOUR=1` і використовуйте прямий маршрут або
   маршрут Tailnet.

## Поширені режими відмов

- **Bonjour не перетинає мережі**: використовуйте Tailnet або SSH.
- **Multicast заблоковано**: деякі Wi-Fi мережі вимикають mDNS.
- **Advertiser застряг у probing/announcing**: хости із заблокованим multicast,
  container bridges, WSL або зміни інтерфейсів можуть залишити ciao advertiser у
  неоголошеному стані. OpenClaw повторює спробу кілька разів, а потім вимикає Bonjour
  для поточного процесу Gateway замість нескінченного перезапуску advertiser.
- **Мережа Docker bridge**: Bonjour автоматично вимикається у виявлених контейнерах.
  Установлюйте `OPENCLAW_DISABLE_BONJOUR=0` лише для host, macvlan або іншої
  мережі з підтримкою mDNS.
- **Сон / зміни інтерфейсів**: macOS може тимчасово втрачати результати mDNS; повторіть спробу.
- **Перегляд працює, але розв'язання не вдається**: використовуйте прості імена машин (уникайте emoji або
  пунктуації), потім перезапустіть Gateway. Ім'я екземпляра служби походить від
  імені хоста, тому надто складні імена можуть збивати з пантелику деякі resolver.

## Екрановані імена екземплярів (`\032`)

Bonjour/DNS-SD часто екранує байти в іменах екземплярів служб як десяткові послідовності `\DDD`
(наприклад, пробіли стають `\032`).

- Це нормально на рівні протоколу.
- UI мають декодувати для відображення (iOS використовує `BonjourEscapes.decode`).

## Увімкнення / вимкнення / конфігурація

- Хости macOS за замовчуванням автоматично запускають вбудований Plugin виявлення LAN.
- `openclaw plugins enable bonjour` вмикає вбудований Plugin виявлення LAN на хостах, де він не ввімкнений за замовчуванням.
- `openclaw plugins disable bonjour` вимикає multicast-рекламування LAN, вимикаючи вбудований Plugin.
- `OPENCLAW_DISABLE_BONJOUR=1` вимикає multicast-рекламування LAN без зміни конфігурації Plugin; прийняті істинні значення: `1`, `true`, `yes` і `on` (застаріле: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` примусово вмикає multicast-рекламування LAN, зокрема всередині виявлених контейнерів; прийняті хибні значення: `0`, `false`, `no` і `off`.
- Коли Plugin Bonjour увімкнено, а `OPENCLAW_DISABLE_BONJOUR` не встановлено, Bonjour рекламується на звичайних хостах і автоматично вимикається всередині виявлених контейнерів.
- `gateway.bind` у `~/.openclaw/openclaw.json` керує режимом прив’язки Gateway.
- `OPENCLAW_SSH_PORT` перевизначає порт SSH, коли рекламується `sshPort` (застаріле: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` публікує підказку MagicDNS у TXT, коли ввімкнено повний режим mDNS (застаріле: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` перевизначає рекламований шлях CLI (застаріле: `OPENCLAW_CLI_PATH`).

## Пов’язані документи

- Політика виявлення та вибір транспорту: [Виявлення](/uk/gateway/discovery)
- Сполучення Node + схвалення: [Сполучення Gateway](/uk/gateway/pairing)
