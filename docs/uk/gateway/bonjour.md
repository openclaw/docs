---
read_when:
    - Налагодження проблем із виявленням Bonjour у macOS/iOS
    - Зміна типів служб mDNS, записів TXT або UX виявлення
summary: Виявлення + налагодження Bonjour/mDNS (маячки Gateway, клієнти та типові сценарії збоїв)
title: Виявлення Bonjour
x-i18n:
    generated_at: "2026-04-28T23:57:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0720451843aae0509949324e51f3a23dc69e366e68de851c595ce76c8ab0eec9
    source_path: gateway/bonjour.md
    workflow: 16
---

# Виявлення Bonjour / mDNS

OpenClaw використовує Bonjour (mDNS / DNS‑SD) для виявлення активного Gateway (кінцевої точки WebSocket).
Перегляд multicast `local.` — це **зручність лише для LAN**. Вбудований Plugin `bonjour`
відповідає за оголошення в LAN і ввімкнений за замовчуванням. Для виявлення між різними мережами
той самий маяк також можна опублікувати через налаштований домен широкозонної DNS-SD.
Виявлення все одно працює за принципом best-effort і **не** замінює SSH або підключення на основі Tailnet.

## Широкозонний Bonjour (Unicast DNS-SD) через Tailscale

Якщо вузол і gateway перебувають у різних мережах, multicast mDNS не перетне
межу. Можна зберегти той самий UX виявлення, перемкнувшись на **unicast DNS‑SD**
("Wide‑Area Bonjour") через Tailscale.

Загальні кроки:

1. Запустіть DNS-сервер на хості gateway (доступний через Tailnet).
2. Опублікуйте DNS‑SD-записи для `_openclaw-gw._tcp` у виділеній зоні
   (приклад: `openclaw.internal.`).
3. Налаштуйте **split DNS** у Tailscale, щоб вибраний домен для клієнтів
   (зокрема iOS) розв’язувався через цей DNS-сервер.

OpenClaw підтримує будь-який домен виявлення; `openclaw.internal.` — лише приклад.
Вузли iOS/Android переглядають і `local.`, і ваш налаштований широкозонний домен.

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

- слухав порт 53 лише на інтерфейсах Tailscale gateway
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

Щойно клієнти приймуть tailnet DNS, вузли iOS і CLI-виявлення зможуть переглядати
`_openclaw-gw._tcp` у вашому домені виявлення без multicast.

### Безпека слухача Gateway (рекомендовано)

Порт WS Gateway (за замовчуванням `18789`) типово прив’язується до loopback. Для доступу
через LAN/tailnet явно задайте прив’язку й залиште автентифікацію ввімкненою.

Для налаштувань лише через tailnet:

- Установіть `gateway.bind: "tailnet"` у `~/.openclaw/openclaw.json`.
- Перезапустіть Gateway (або перезапустіть застосунок у menubar macOS).

## Що оголошується

Лише Gateway оголошує `_openclaw-gw._tcp`. LAN multicast-оголошення
надає вбудований Plugin `bonjour`; публікація широкозонної DNS-SD залишається
у власності Gateway.

## Типи сервісів

- `_openclaw-gw._tcp` — маяк транспорту gateway (використовується вузлами macOS/iOS/Android).

## TXT-ключі (несекретні підказки)

Gateway оголошує невеликі несекретні підказки, щоб зробити UI-потоки зручними:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (лише коли TLS увімкнено)
- `gatewayTlsSha256=<sha256>` (лише коли TLS увімкнено й fingerprint доступний)
- `canvasPort=<port>` (лише коли canvas host увімкнено; наразі такий самий, як `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (лише повний режим mDNS, необов’язкова підказка, коли Tailnet доступний)
- `sshPort=<port>` (лише повний режим mDNS; широкозонна DNS-SD може його пропускати)
- `cliPath=<path>` (лише повний режим mDNS; широкозонна DNS-SD все одно записує його як підказку для віддаленого встановлення)

Нотатки щодо безпеки:

- TXT-записи Bonjour/mDNS **не автентифіковані**. Клієнти не повинні вважати TXT авторитетним джерелом маршрутизації.
- Клієнти мають маршрутизувати, використовуючи розв’язану кінцеву точку сервісу (SRV + A/AAAA). Вважайте `lanHost`, `tailnetDns`, `gatewayPort` і `gatewayTlsSha256` лише підказками.
- SSH auto-targeting так само має використовувати розв’язаний хост сервісу, а не підказки лише з TXT.
- TLS pinning ніколи не повинен дозволяти оголошеному `gatewayTlsSha256` перевизначати раніше збережений pin.
- Вузли iOS/Android мають вважати прямі підключення на основі виявлення **лише TLS** і вимагати явного підтвердження користувача перед довірою до fingerprint уперше.

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

## Налагодження в логах Gateway

Gateway пише ротаційний файл журналу (друкується під час запуску як
`gateway log file: ...`). Шукайте рядки `bonjour:`, особливо:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Bonjour використовує системне ім’я хоста для оголошеного хоста `.local`, коли воно є
дійсною DNS-міткою. Якщо системне ім’я хоста містить пробіли, підкреслення або інший
недійсний символ DNS-мітки, OpenClaw повертається до `openclaw.local`. Установіть
`OPENCLAW_MDNS_HOSTNAME=<name>` перед запуском Gateway, коли потрібна явна
мітка хоста.

## Налагодження на вузлі iOS

Вузол iOS використовує `NWBrowser` для виявлення `_openclaw-gw._tcp`.

Щоб зібрати логи:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → відтворіть → **Copy**

Журнал містить переходи станів browser і зміни набору результатів.

## Коли вимикати Bonjour

Вимикайте Bonjour лише тоді, коли LAN multicast-оголошення недоступне або шкідливе.
Типовий випадок — Gateway, що працює за Docker bridge networking, WSL або
мережевою політикою, яка відкидає mDNS multicast. У таких середовищах Gateway
усе ще доступний через опублікований URL, SSH, Tailnet або широкозонну DNS-SD,
але автоматичне LAN-виявлення ненадійне.

Віддавайте перевагу наявному перевизначенню середовища, коли проблема пов’язана з deployment:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Це вимикає LAN multicast-оголошення без зміни конфігурації Plugin.
Це безпечно для Docker-образів, service files, launch scripts і одноразового
налагодження, бо налаштування зникає разом із середовищем.

Використовуйте конфігурацію Plugin лише тоді, коли навмисно хочете вимкнути
вбудований LAN discovery Plugin для цієї конфігурації OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Особливості Docker

Вбудований Bonjour Plugin автоматично вимикає LAN multicast-оголошення у виявлених
контейнерах, коли `OPENCLAW_DISABLE_BONJOUR` не задано. Docker bridge networks
зазвичай не пересилають mDNS multicast (`224.0.0.251:5353`) між контейнером
і LAN, тому оголошення з контейнера рідко забезпечує роботу виявлення.

Важливі особливості:

- Вимкнення Bonjour не зупиняє Gateway. Воно лише зупиняє LAN multicast
  оголошення.
- Вимкнення Bonjour не змінює `gateway.bind`; Docker усе ще за замовчуванням використовує
  `OPENCLAW_GATEWAY_BIND=lan`, щоб опублікований порт хоста міг працювати.
- Вимкнення Bonjour не вимикає широкозонну DNS-SD. Використовуйте широкозонне виявлення
  або Tailnet, коли Gateway і вузол не в одній LAN.
- Повторне використання того самого `OPENCLAW_CONFIG_DIR` поза Docker не зберігає
  політику автоматичного вимкнення контейнера.
- Установлюйте `OPENCLAW_DISABLE_BONJOUR=0` лише для host networking, macvlan або іншої
  мережі, де відомо, що mDNS multicast проходить; установлюйте `1`, щоб примусово вимкнути.

## Усунення проблем із вимкненим Bonjour

Якщо вузол більше не виявляє Gateway автоматично після налаштування Docker:

1. Підтвердьте, у якому режимі працює Gateway: auto, forced-on чи forced-off:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Підтвердьте, що сам Gateway доступний через опублікований порт:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Використовуйте прямий target, коли Bonjour вимкнено:
   - Control UI або локальні інструменти: `http://127.0.0.1:18789`
   - LAN-клієнти: `http://<gateway-host>:18789`
   - Клієнти між мережами: Tailnet MagicDNS, Tailnet IP, SSH tunnel або
     широкозонна DNS-SD

4. Якщо ви навмисно ввімкнули Bonjour у Docker через
   `OPENCLAW_DISABLE_BONJOUR=0`, протестуйте multicast з хоста:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Якщо перегляд порожній або логи Gateway показують повторні ciao watchdog
   cancellations, відновіть `OPENCLAW_DISABLE_BONJOUR=1` і використовуйте прямий
   або Tailnet-маршрут.

## Поширені режими відмов

- **Bonjour не працює між мережами**: використовуйте Tailnet або SSH.
- **Multicast заблоковано**: деякі Wi‑Fi-мережі вимикають mDNS.
- **Advertiser застряг у probing/announcing**: хости із заблокованим multicast,
  container bridges, WSL або зміни інтерфейсів можуть залишити ciao advertiser у
  неоголошеному стані. OpenClaw повторює спробу кілька разів, а потім вимикає Bonjour
  для поточного процесу Gateway замість нескінченного перезапуску advertiser.
- **Docker bridge networking**: Bonjour автоматично вимикається у виявлених контейнерах.
  Установлюйте `OPENCLAW_DISABLE_BONJOUR=0` лише для host, macvlan або іншої
  мережі з підтримкою mDNS.
- **Sleep / зміни інтерфейсів**: macOS може тимчасово втрачати результати mDNS; повторіть спробу.
- **Перегляд працює, але розв’язання не вдається**: тримайте імена машин простими (уникайте emoji або
  пунктуації), потім перезапустіть Gateway. Ім’я екземпляра сервісу походить від
  імені хоста, тому надто складні імена можуть заплутувати деякі резолвери.

## Екрановані імена екземплярів (`\032`)

Bonjour/DNS‑SD часто екранує байти в іменах екземплярів сервісів як десяткові
послідовності `\DDD` (наприклад, пробіли стають `\032`).

- Це нормально на рівні протоколу.
- UI має декодувати для відображення (iOS використовує `BonjourEscapes.decode`).

## Вимкнення / конфігурація

- `openclaw plugins disable bonjour` вимикає LAN multicast-оголошення, вимикаючи вбудований Plugin.
- `openclaw plugins enable bonjour` відновлює типовий LAN discovery Plugin.
- `OPENCLAW_DISABLE_BONJOUR=1` вимикає LAN multicast-оголошення без зміни конфігурації Plugin; прийняті truthy-значення: `1`, `true`, `yes` і `on` (legacy: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` примусово вмикає LAN multicast-оголошення, зокрема всередині виявлених контейнерів; прийняті falsy-значення: `0`, `false`, `no` і `off`.
- Коли `OPENCLAW_DISABLE_BONJOUR` не задано, Bonjour оголошує на звичайних хостах і автоматично вимикається всередині виявлених контейнерів.
- `gateway.bind` у `~/.openclaw/openclaw.json` керує режимом прив’язки Gateway.
- `OPENCLAW_SSH_PORT` перевизначає SSH-порт, коли `sshPort` оголошується (legacy: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` публікує підказку MagicDNS у TXT, коли ввімкнено повний режим mDNS (legacy: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` перевизначає оголошений шлях CLI (legacy: `OPENCLAW_CLI_PATH`).

## Пов’язана документація

- Політика виявлення та вибір транспорту: [Виявлення](/uk/gateway/discovery)
- Сполучення вузла + схвалення: [Сполучення Gateway](/uk/gateway/pairing)
