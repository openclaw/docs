---
read_when:
    - Налагодження проблем виявлення Bonjour на macOS/iOS
    - Зміна типів сервісів mDNS, записів TXT або UX виявлення
summary: Виявлення та налагодження Bonjour/mDNS (маяки Gateway, клієнти та поширені режими відмови)
title: Виявлення Bonjour
x-i18n:
    generated_at: "2026-04-26T00:18:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: ced3a4a81ab6a4e8c32a33c967ff3e173485c3e644885192012eaca8b81a065f
    source_path: gateway/bonjour.md
    workflow: 15
---

# Виявлення Bonjour / mDNS

OpenClaw використовує Bonjour (mDNS / DNS‑SD) для виявлення активного Gateway (кінцевої точки WebSocket).
Багатоадресний перегляд `local.` — це **зручність лише для LAN**. Вбудований
plugin `bonjour` відповідає за рекламування в LAN і ввімкнений за замовчуванням. Для міжмережевого виявлення
той самий маяк також може публікуватися через налаштований домен DNS-SD широкої зони.
Виявлення все одно є best-effort і **не** замінює підключення через SSH або Tailnet.

## Bonjour широкої зони (Unicast DNS-SD) через Tailscale

Якщо Node і Gateway перебувають у різних мережах, багатоадресний mDNS не перетне
цю межу. Ви можете зберегти той самий UX виявлення, переключившись на **unicast DNS‑SD**
("Bonjour широкої зони") через Tailscale.

Загальні кроки:

1. Запустіть DNS-сервер на хості Gateway (доступний через Tailnet).
2. Опублікуйте записи DNS‑SD для `_openclaw-gw._tcp` у виділеній зоні
   (приклад: `openclaw.internal.`).
3. Налаштуйте в Tailscale **split DNS**, щоб вибраний вами домен резолвився через цей
   DNS-сервер для клієнтів (зокрема iOS).

OpenClaw підтримує будь-який домен виявлення; `openclaw.internal.` — лише приклад.
Node на iOS/Android переглядають і `local.`, і налаштований вами домен широкої зони.

### Конфігурація Gateway (рекомендовано)

```json5
{
  gateway: { bind: "tailnet" }, // лише tailnet (рекомендовано)
  discovery: { wideArea: { enabled: true } }, // вмикає публікацію DNS-SD широкої зони
}
```

### Одноразове налаштування DNS-сервера (хост Gateway)

```bash
openclaw dns setup --apply
```

Це встановить CoreDNS і налаштує його так, щоб він:

- слухав порт 53 лише на інтерфейсах Tailscale Gateway
- обслуговував вибраний вами домен (приклад: `openclaw.internal.`) з `~/.openclaw/dns/<domain>.db`

Перевірте з машини, підключеної до tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Налаштування DNS у Tailscale

У консолі адміністрування Tailscale:

- Додайте nameserver, що вказує на tailnet IP Gateway (UDP/TCP 53).
- Додайте split DNS, щоб ваш домен виявлення використовував цей nameserver.

Після того як клієнти приймуть DNS tailnet, Node на iOS і виявлення через CLI зможуть переглядати
`_openclaw-gw._tcp` у вашому домені виявлення без багатоадресності.

### Безпека слухача Gateway (рекомендовано)

Порт WS Gateway (типово `18789`) за замовчуванням прив’язується до loopback. Для доступу з LAN/tailnet
явно задайте прив’язку та залиште автентифікацію ввімкненою.

Для конфігурацій лише з tailnet:

- Установіть `gateway.bind: "tailnet"` у `~/.openclaw/openclaw.json`.
- Перезапустіть Gateway (або перезапустіть застосунок рядка меню macOS).

## Що рекламується

Лише Gateway рекламує `_openclaw-gw._tcp`. Рекламування багатоадресності в LAN
забезпечується вбудованим plugin `bonjour`; публікація DNS-SD широкої зони й надалі
належить Gateway.

## Типи сервісів

- `_openclaw-gw._tcp` — транспортний маяк gateway (використовується Node на macOS/iOS/Android).

## Ключі TXT (несекретні підказки)

Gateway рекламує невеликі несекретні підказки, щоб зробити UI-потоки зручнішими:

- `role=gateway`
- `displayName=<дружня назва>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (WS + HTTP Gateway)
- `gatewayTls=1` (лише коли TLS увімкнено)
- `gatewayTlsSha256=<sha256>` (лише коли TLS увімкнено і доступний відбиток)
- `canvasPort=<port>` (лише коли ввімкнено хост canvas; наразі такий самий, як `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (лише у повному режимі mDNS, необов’язкова підказка, коли доступний Tailnet)
- `sshPort=<port>` (лише у повному режимі mDNS; DNS-SD широкої зони може його не включати)
- `cliPath=<path>` (лише у повному режимі mDNS; DNS-SD широкої зони все одно записує його як підказку для віддаленого встановлення)

Примітки щодо безпеки:

- Записи TXT у Bonjour/mDNS **неавтентифіковані**. Клієнти не повинні вважати TXT авторитетним джерелом маршрутизації.
- Клієнти повинні маршрутизувати за допомогою резолвленої кінцевої точки сервісу (SRV + A/AAAA). Розглядайте `lanHost`, `tailnetDns`, `gatewayPort` і `gatewayTlsSha256` лише як підказки.
- Автоматичне націлювання SSH так само повинно використовувати резолвлений хост сервісу, а не лише підказки з TXT.
- TLS pinning ніколи не повинен дозволяти рекламованому `gatewayTlsSha256` перевизначати раніше збережений pin.
- Node на iOS/Android повинні розглядати прямі підключення на основі виявлення як **лише TLS** і вимагати явного підтвердження користувача перед довірою до відбитка, побаченого вперше.

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

## Налагодження в журналах Gateway

Gateway записує журнал у циклічний log-файл (виводиться під час запуску як
`gateway log file: ...`). Шукайте рядки `bonjour:`, особливо:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

## Налагодження на iOS Node

iOS Node використовує `NWBrowser` для виявлення `_openclaw-gw._tcp`.

Щоб зібрати журнали:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → відтворіть проблему → **Copy**

Журнал містить переходи стану браузера та зміни набору результатів.

## Поширені режими відмови

- **Bonjour не працює між мережами**: використовуйте Tailnet або SSH.
- **Багатоадресність заблокована**: деякі мережі Wi‑Fi вимикають mDNS.
- **Рекламування застрягло на probing/announcing**: хости із заблокованою багатоадресністю,
  мостами контейнерів, WSL або змінами інтерфейсів можуть залишити рекламувальник ciao у
  стані без оголошення. OpenClaw повторює спробу кілька разів, а потім вимикає Bonjour
  для поточного процесу Gateway замість безкінечного перезапуску рекламувальника.
- **Сон / зміни інтерфейсів**: macOS може тимчасово втрачати результати mDNS; повторіть спробу.
- **Перегляд працює, а резолв — ні**: використовуйте прості назви машин (уникайте емодзі чи
  розділових знаків), а потім перезапустіть Gateway. Ім’я екземпляра сервісу походить від
  імені хоста, тому надто складні імена можуть заплутати деякі резолвери.

## Екрановані імена екземплярів (`\032`)

Bonjour/DNS‑SD часто екранує байти в іменах екземплярів сервісів як десяткові послідовності `\DDD`
(наприклад, пробіли стають `\032`).

- Це нормально на рівні протоколу.
- UI повинні декодувати це для відображення (iOS використовує `BonjourEscapes.decode`).

## Вимкнення / конфігурація

- `openclaw plugins disable bonjour` вимикає рекламування багатоадресності в LAN, вимикаючи вбудований plugin.
- `openclaw plugins enable bonjour` відновлює типовий plugin виявлення в LAN.
- `OPENCLAW_DISABLE_BONJOUR=1` вимикає рекламування багатоадресності в LAN без зміни конфігурації plugin; допустимі truthy-значення: `1`, `true`, `yes` і `on` (legacy: `OPENCLAW_DISABLE_BONJOUR`).
- `gateway.bind` у `~/.openclaw/openclaw.json` керує режимом прив’язки Gateway.
- `OPENCLAW_SSH_PORT` перевизначає порт SSH, коли рекламується `sshPort` (legacy: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` публікує підказку MagicDNS у TXT, коли ввімкнено повний режим mDNS (legacy: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` перевизначає рекламований шлях CLI (legacy: `OPENCLAW_CLI_PATH`).

## Пов’язана документація

- Політика виявлення та вибір транспорту: [Виявлення](/uk/gateway/discovery)
- Спарювання Node + схвалення: [Спарювання Gateway](/uk/gateway/pairing)
