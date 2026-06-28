---
read_when:
    - Налагодження проблем виявлення Bonjour на macOS/iOS
    - Зміна типів служб mDNS, записів TXT або UX виявлення
summary: Bonjour/mDNS-виявлення та налагодження (маяки Gateway, клієнти та типові сценарії збоїв)
title: Виявлення Bonjour
x-i18n:
    generated_at: "2026-05-12T12:50:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 05892ee8f0dc880f68f7cf024de9452b8d999ff1af3c7ca9850fb4f2d732af0c
    source_path: gateway/bonjour.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw може використовувати Bonjour (mDNS / DNS-SD), щоб виявляти активний Gateway (кінцеву точку WebSocket).
Багатоадресний перегляд `local.` — це **зручність лише для LAN**. Вбудований `bonjour`
plugin відповідає за оголошення в LAN. Він автоматично запускається на хостах macOS і вмикається вручну для
розгортань Gateway у Linux, Windows і контейнерах. Для виявлення між мережами той самий
beacon також можна опублікувати через налаштований домен wide-area DNS-SD. Виявлення
й далі працює за принципом best-effort і **не** замінює підключення через SSH або Tailnet.

## Wide-area Bonjour (Unicast DNS-SD) через Tailscale

Якщо вузол і gateway перебувають у різних мережах, багатоадресний mDNS не перетне
межу. Ви можете зберегти той самий UX виявлення, перемкнувшись на **unicast DNS-SD**
("Wide-Area Bonjour") через Tailscale.

Кроки високого рівня:

1. Запустіть DNS-сервер на хості gateway (доступний через Tailnet).
2. Опублікуйте записи DNS-SD для `_openclaw-gw._tcp` у виділеній зоні
   (приклад: `openclaw.internal.`).
3. Налаштуйте Tailscale **split DNS**, щоб вибраний домен розв’язувався через цей
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

- прослуховував порт 53 лише на інтерфейсах Tailscale gateway
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

Після того як клієнти приймуть tailnet DNS, вузли iOS і виявлення CLI зможуть переглядати
`_openclaw-gw._tcp` у вашому домені виявлення без multicast.

### Безпека слухача Gateway (рекомендовано)

Порт Gateway WS (типово `18789`) за замовчуванням прив’язується до loopback. Для доступу через LAN/tailnet
задайте прив’язку явно й залиште автентифікацію ввімкненою.

Для налаштувань лише через tailnet:

- Установіть `gateway.bind: "tailnet"` у `~/.openclaw/openclaw.json`.
- Перезапустіть Gateway (або перезапустіть застосунок macOS у рядку меню).

## Що оголошує

Лише Gateway оголошує `_openclaw-gw._tcp`. Багатоадресне оголошення в LAN
надає вбудований `bonjour` plugin, коли plugin увімкнено; публікація wide-area
DNS-SD залишається у власності Gateway.

## Типи сервісів

- `_openclaw-gw._tcp` - beacon транспорту gateway (використовується вузлами macOS/iOS/Android).

## Ключі TXT (несекретні підказки)

Gateway оголошує невеликі несекретні підказки, щоб зробити потоки UI зручними:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (лише коли TLS увімкнено)
- `gatewayTlsSha256=<sha256>` (лише коли TLS увімкнено і fingerprint доступний)
- `canvasPort=<port>` (лише коли хост canvas увімкнено; наразі той самий, що й `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (лише повний режим mDNS, необов’язкова підказка, коли Tailnet доступний)
- `sshPort=<port>` (лише повний режим; пропускається в мінімальному та вимкненому режимах)
- `cliPath=<path>` (лише повний режим; пропускається в мінімальному та вимкненому режимах)

Примітки щодо безпеки:

- Записи Bonjour/mDNS TXT **не автентифікуються**. Клієнти не повинні вважати TXT авторитетним джерелом маршрутизації.
- Клієнти мають маршрутизувати, використовуючи розв’язану кінцеву точку сервісу (SRV + A/AAAA). Розглядайте `lanHost`, `tailnetDns`, `gatewayPort` і `gatewayTlsSha256` лише як підказки.
- Автоматичний вибір цілі SSH так само має використовувати розв’язаний хост сервісу, а не підказки лише з TXT.
- Закріплення TLS ніколи не має дозволяти оголошеному `gatewayTlsSha256` перевизначати раніше збережений pin.
- Вузли iOS/Android мають розглядати прямі підключення на основі виявлення як **лише TLS** і вимагати явного підтвердження користувача перед довірою до першого fingerprint.

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

Якщо перегляд працює, але розв’язання завершується помилкою, зазвичай причина в політиці LAN або
проблемі resolver mDNS.

## Налагодження в журналах Gateway

Gateway записує ротаційний файл журналу (друкується під час запуску як
`gateway log file: ...`). Шукайте рядки `bonjour:`, особливо:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Watchdog розглядає активні `probing`, `announcing` і свіжі перейменування через конфлікт як
стани в процесі виконання. Якщо сервіс ніколи не досягає `announced`, OpenClaw зрештою
перестворює advertiser і, після повторних помилок, вимикає Bonjour для цього
процесу Gateway замість нескінченного повторного оголошення.

Bonjour використовує системне ім’я хоста для оголошеного хоста `.local`, коли воно є
дійсною DNS-міткою. Якщо системне ім’я хоста містить пробіли, підкреслення або інший
недійсний символ DNS-мітки, OpenClaw повертається до `openclaw.local`. Установіть
`OPENCLAW_MDNS_HOSTNAME=<name>` перед запуском Gateway, коли вам потрібна
явна мітка хоста.

## Налагодження на вузлі iOS

Вузол iOS використовує `NWBrowser`, щоб виявляти `_openclaw-gw._tcp`.

Щоб зібрати журнали:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → відтворіть → **Copy**

Журнал містить переходи станів browser і зміни набору результатів.

## Коли вмикати Bonjour

Bonjour автоматично запускається для запуску Gateway з порожньою конфігурацією на хостах macOS, тому що
локальний застосунок і найближчі вузли iOS/Android часто покладаються на виявлення в тій самій LAN.

Увімкніть Bonjour явно, коли автоматичне виявлення в тій самій LAN корисне на Linux,
Windows або іншому хості не macOS:

```bash
openclaw plugins enable bonjour
```

Коли ввімкнено, Bonjour використовує `discovery.mdns.mode`, щоб визначити, скільки метаданих TXT
публікувати. Той самий режим керує необов’язковими підказками TXT у записах wide-area DNS-SD.
Типовий режим — `minimal`; використовуйте `full` лише тоді, коли клієнтам потрібні підказки `cliPath` або
`sshPort`. Використовуйте `off`, щоб придушити багатоадресну передачу LAN без зміни
увімкнення plugin; wide-area DNS-SD усе ще може публікувати мінімальний beacon Gateway, коли
`discovery.wideArea.enabled` має значення true.

## Коли вимикати Bonjour

Залишайте Bonjour вимкненим, коли багатоадресне оголошення в LAN непотрібне, недоступне
або шкідливе. Типові випадки — сервери не macOS, мережа Docker bridge,
WSL або мережева політика, що відкидає multicast mDNS. У цих середовищах
Gateway і далі доступний через опубліковану URL-адресу, SSH, Tailnet або wide-area
DNS-SD, але автоматичне виявлення в LAN ненадійне.

Надавайте перевагу наявному перевизначенню середовища, коли проблема стосується розгортання:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Це вимикає багатоадресне оголошення в LAN без зміни конфігурації plugin.
Це безпечно для Docker-образів, service files, скриптів запуску та одноразового
налагодження, бо налаштування зникає разом із середовищем.

Використовуйте конфігурацію plugin, коли ви навмисно хочете вимкнути вбудований LAN
discovery plugin для цієї конфігурації OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Підводні камені Docker

Вбудований Bonjour plugin автоматично вимикає багатоадресне оголошення LAN у виявлених
контейнерах, коли `OPENCLAW_DISABLE_BONJOUR` не задано. Мережі Docker bridge
зазвичай не пересилають multicast mDNS (`224.0.0.251:5353`) між контейнером
і LAN, тому оголошення з контейнера рідко забезпечує роботу виявлення.

Важливі підводні камені:

- Bonjour автоматично запускається на хостах macOS і вмикається вручну в інших середовищах. Якщо залишити його
  вимкненим, це не зупиняє Gateway; це лише пропускає багатоадресне оголошення LAN.
- Вимкнення Bonjour не змінює `gateway.bind`; Docker усе ще типово використовує
  `OPENCLAW_GATEWAY_BIND=lan`, щоб опублікований порт хоста міг працювати.
- Вимкнення Bonjour не вимикає wide-area DNS-SD. Використовуйте wide-area discovery
  або Tailnet, коли Gateway і вузол не в одній LAN.
- Повторне використання того самого `OPENCLAW_CONFIG_DIR` поза Docker не зберігає
  політику автоматичного вимкнення контейнера.
- Установлюйте `OPENCLAW_DISABLE_BONJOUR=0` лише для host networking, macvlan або іншої
  мережі, де multicast mDNS гарантовано проходить; установіть його в `1`, щоб примусово вимкнути.

## Усунення несправностей вимкненого Bonjour

Якщо вузол більше не виявляє Gateway автоматично після налаштування Docker:

1. Підтвердьте, чи Gateway працює в автоматичному, примусово ввімкненому або примусово вимкненому режимі:

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

4. Якщо ви навмисно ввімкнули Bonjour plugin у Docker і примусово ввімкнули оголошення
   за допомогою `OPENCLAW_DISABLE_BONJOUR=0`, протестуйте multicast з хоста:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Якщо перегляд порожній або журнали Gateway показують повторні скасування
   ciao watchdog, відновіть `OPENCLAW_DISABLE_BONJOUR=1` і використовуйте прямий або
   Tailnet маршрут.

## Поширені режими відмови

- **Bonjour не перетинає мережі**: використовуйте Tailnet або SSH.
- **Multicast заблоковано**: деякі мережі Wi-Fi вимикають mDNS.
- **Advertiser застряг у probing/announcing**: хости із заблокованим multicast,
  container bridges, WSL або зміни інтерфейсів можуть залишити ciao advertiser у
  неоголошеному стані. OpenClaw повторює спробу кілька разів, а потім вимикає Bonjour
  для поточного процесу Gateway замість нескінченного перезапуску advertiser.
- **Мережа Docker bridge**: Bonjour автоматично вимикається у виявлених контейнерах.
  Установлюйте `OPENCLAW_DISABLE_BONJOUR=0` лише для host, macvlan або іншої
  мережі з підтримкою mDNS.
- **Сон / зміни інтерфейсів**: macOS може тимчасово втратити результати mDNS; повторіть спробу.
- **Перегляд працює, але розв’язання завершується помилкою**: використовуйте прості імена машин (уникайте емодзі або
  пунктуації), потім перезапустіть Gateway. Ім’я екземпляра сервісу походить від
  імені хоста, тому надто складні імена можуть збивати з пантелику деякі resolver.

## Екрановані імена екземплярів (`\032`)

Bonjour/DNS-SD часто екранує байти в іменах екземплярів сервісів як десяткові
послідовності `\DDD` (наприклад, пробіли стають `\032`).

- Це нормально на рівні протоколу.
- UI має декодувати для відображення (iOS використовує `BonjourEscapes.decode`).

## Увімкнення / вимкнення / конфігурація

- Хости macOS автоматично запускають вбудований Plugin виявлення локальної мережі за замовчуванням.
- `openclaw plugins enable bonjour` вмикає вбудований Plugin виявлення локальної мережі на хостах, де його не ввімкнено за замовчуванням.
- `openclaw plugins disable bonjour` вимикає багатоадресне оголошення в локальній мережі, вимикаючи вбудований Plugin.
- `OPENCLAW_DISABLE_BONJOUR=1` вимикає багатоадресне оголошення в локальній мережі без зміни конфігурації Plugin; прийняті істинні значення: `1`, `true`, `yes` і `on` (застаріле: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` примусово вмикає багатоадресне оголошення в локальній мережі, зокрема всередині виявлених контейнерів; прийняті хибні значення: `0`, `false`, `no` і `off`.
- Коли Plugin Bonjour увімкнено, а `OPENCLAW_DISABLE_BONJOUR` не задано, Bonjour оголошується на звичайних хостах і автоматично вимикається всередині виявлених контейнерів.
- `gateway.bind` у `~/.openclaw/openclaw.json` керує режимом прив’язки Gateway.
- `OPENCLAW_SSH_PORT` перевизначає порт SSH, коли оголошується `sshPort` (застаріле: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` публікує підказку MagicDNS у TXT, коли ввімкнено повний режим mDNS (застаріле: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` перевизначає оголошений шлях CLI (застаріле: `OPENCLAW_CLI_PATH`).

## Пов’язані документи

- Політика виявлення та вибір транспорту: [Виявлення](/uk/gateway/discovery)
- Сполучення Node + схвалення: [Сполучення Gateway](/uk/gateway/pairing)
