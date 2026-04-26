---
read_when:
    - Налагодження проблем виявлення Bonjour на macOS/iOS
    - Зміна типів сервісів mDNS, записів TXT або UX виявлення
summary: Виявлення та налагодження Bonjour/mDNS (маяки Gateway, клієнти та поширені режими відмов)
title: виявлення Bonjour
x-i18n:
    generated_at: "2026-04-26T04:54:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 625d4fbf8fe46938ee42f267d2bdabe6ab9c2766d6b2debc30de3c43f0de724c
    source_path: gateway/bonjour.md
    workflow: 15
---

# Виявлення Bonjour / mDNS

OpenClaw використовує Bonjour (mDNS / DNS‑SD) для виявлення активного Gateway (кінцевої точки WebSocket).
Багатоадресний перегляд `local.` — це **лише зручність у межах LAN**. Вбудований Plugin `bonjour`
відповідає за рекламу в LAN і ввімкнений за замовчуванням. Для виявлення між різними мережами
той самий маяк також може публікуватися через налаштований домен wide-area DNS-SD.
Виявлення все одно виконується за принципом best-effort і **не** замінює підключення через SSH або Tailnet.

## Wide-area Bonjour (Unicast DNS-SD) через Tailscale

Якщо node і gateway перебувають у різних мережах, багатоадресний mDNS не перетне
цю межу. Ви можете зберегти той самий UX виявлення, переключившись на **unicast DNS‑SD**
("Wide‑Area Bonjour") через Tailscale.

Загальні кроки:

1. Запустіть DNS-сервер на хості gateway (доступний через Tailnet).
2. Опублікуйте записи DNS‑SD для `_openclaw-gw._tcp` у виділеній зоні
   (приклад: `openclaw.internal.`).
3. Налаштуйте в Tailscale **split DNS**, щоб вибраний домен резолвився через цей
   DNS-сервер для клієнтів (зокрема iOS).

OpenClaw підтримує будь-який домен виявлення; `openclaw.internal.` — лише приклад.
Node iOS/Android переглядають і `local.`, і налаштований вами wide-area домен.

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

Це встановлює CoreDNS і налаштовує його так, щоб він:

- слухав порт 53 лише на Tailscale-інтерфейсах gateway
- обслуговував вибраний вами домен (приклад: `openclaw.internal.`) з `~/.openclaw/dns/<domain>.db`

Перевірте з машини, підключеної до tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Налаштування DNS у Tailscale

У консолі адміністратора Tailscale:

- Додайте nameserver, що вказує на tailnet IP gateway (UDP/TCP 53).
- Додайте split DNS, щоб ваш домен виявлення використовував цей nameserver.

Щойно клієнти приймуть DNS tailnet, node iOS і виявлення CLI зможуть переглядати
`_openclaw-gw._tcp` у вашому домені виявлення без багатоадресної передачі.

### Безпека слухача Gateway (рекомендовано)

Порт WS Gateway (типово `18789`) за замовчуванням прив’язується до loopback. Для доступу через LAN/tailnet
явно задайте прив’язку та залиште автентифікацію ввімкненою.

Для конфігурацій лише з tailnet:

- Установіть `gateway.bind: "tailnet"` у `~/.openclaw/openclaw.json`.
- Перезапустіть Gateway (або перезапустіть застосунок macOS у рядку меню).

## Що рекламується

Лише Gateway рекламує `_openclaw-gw._tcp`. Багатоадресна реклама в LAN
забезпечується вбудованим Plugin `bonjour`; публікація wide-area DNS-SD і надалі
належить Gateway.

## Типи сервісів

- `_openclaw-gw._tcp` — маяк транспортного рівня gateway (використовується node macOS/iOS/Android).

## Ключі TXT (не секретні підказки)

Gateway рекламує невеликі не секретні підказки, щоб зробити UI-потоки зручнішими:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (лише коли ввімкнено TLS)
- `gatewayTlsSha256=<sha256>` (лише коли ввімкнено TLS і доступний відбиток)
- `canvasPort=<port>` (лише коли ввімкнено canvas host; наразі збігається з `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (лише в режимі mDNS full, необов’язкова підказка, коли Tailnet доступний)
- `sshPort=<port>` (лише в режимі mDNS full; wide-area DNS-SD може його не включати)
- `cliPath=<path>` (лише в режимі mDNS full; wide-area DNS-SD усе одно записує його як підказку для віддаленого встановлення)

Примітки щодо безпеки:

- Записи Bonjour/mDNS TXT **неавтентифіковані**. Клієнти не повинні вважати TXT авторитетним джерелом маршрутизації.
- Клієнти мають маршрутизувати трафік, використовуючи резолвлену кінцеву точку сервісу (SRV + A/AAAA). Сприймайте `lanHost`, `tailnetDns`, `gatewayPort` і `gatewayTlsSha256` лише як підказки.
- Автоматичне націлювання SSH так само має використовувати резолвлений хост сервісу, а не підказки лише з TXT.
- Прив’язка TLS ніколи не повинна дозволяти рекламованому `gatewayTlsSha256` перевизначати раніше збережену прив’язку.
- Node iOS/Android мають розглядати прямі підключення на основі виявлення як **лише TLS** і вимагати явного підтвердження користувача перед довірою до відбитка при першому використанні.

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

Якщо перегляд працює, а резолв — ні, зазвичай проблема в політиці LAN або
в резолвері mDNS.

## Налагодження в логах Gateway

Gateway записує циклічний файл журналу (друкується під час запуску як
`gateway log file: ...`). Шукайте рядки `bonjour:`, зокрема:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

## Налагодження на node iOS

Node iOS використовує `NWBrowser` для виявлення `_openclaw-gw._tcp`.

Щоб зібрати логи:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → відтворіть проблему → **Copy**

Журнал містить переходи стану браузера та зміни набору результатів.

## Поширені режими відмов

- **Bonjour не працює між різними мережами**: використовуйте Tailnet або SSH.
- **Багатоадресна передача заблокована**: деякі Wi‑Fi мережі вимикають mDNS.
- **Рекламування зависло на probing/announcing**: хости із заблокованою багатоадресною передачею,
  мости контейнерів, WSL або зміни інтерфейсів можуть залишити рекламодавець ciao у
  стані non-announced. OpenClaw повторює спробу кілька разів, а потім вимикає Bonjour
  для поточного процесу Gateway замість безкінечного перезапуску рекламодавця.
- **Мережа Docker bridge**: вбудований Docker Compose за замовчуванням вимикає Bonjour
  через `OPENCLAW_DISABLE_BONJOUR=1`. Установлюйте `0` лише для host,
  macvlan або іншої мережі з підтримкою mDNS.
- **Сон / зміни інтерфейсів**: macOS може тимчасово втрачати результати mDNS; повторіть спробу.
- **Перегляд працює, а резолв — ні**: використовуйте прості назви машин (уникайте емодзі або
  пунктуації), а потім перезапустіть Gateway. Ім’я екземпляра сервісу походить від
  імені хоста, тому надто складні імена можуть плутати деякі резолвери.

## Екрановані імена екземплярів (`\032`)

Bonjour/DNS‑SD часто екранує байти в іменах екземплярів сервісу як десяткові послідовності `\DDD`
(наприклад, пробіли стають `\032`).

- Це нормально на рівні протоколу.
- UI мають декодувати це для відображення (iOS використовує `BonjourEscapes.decode`).

## Вимкнення / конфігурація

- `openclaw plugins disable bonjour` вимикає багатоадресну рекламу в LAN, вимикаючи вбудований plugin.
- `openclaw plugins enable bonjour` відновлює типовий plugin виявлення в LAN.
- `OPENCLAW_DISABLE_BONJOUR=1` вимикає багатоадресну рекламу в LAN без зміни конфігурації plugin; підтримувані truthy-значення: `1`, `true`, `yes` і `on` (legacy: `OPENCLAW_DISABLE_BONJOUR`).
- Docker Compose за замовчуванням установлює `OPENCLAW_DISABLE_BONJOUR=1` для bridge networking; перевизначайте на `OPENCLAW_DISABLE_BONJOUR=0` лише коли доступна багатоадресна передача mDNS.
- `gateway.bind` у `~/.openclaw/openclaw.json` керує режимом прив’язки Gateway.
- `OPENCLAW_SSH_PORT` перевизначає порт SSH, коли рекламується `sshPort` (legacy: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` публікує підказку MagicDNS у TXT, коли ввімкнено режим mDNS full (legacy: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` перевизначає рекламований шлях CLI (legacy: `OPENCLAW_CLI_PATH`).

## Пов’язані документи

- Політика виявлення та вибір транспорту: [Виявлення](/uk/gateway/discovery)
- Парування node та схвалення: [Парування Gateway](/uk/gateway/pairing)
