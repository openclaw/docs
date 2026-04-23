---
read_when:
    - Налагодження проблем виявлення Bonjour на macOS/iOS
    - Зміна типів сервісів mDNS, TXT-записів або UX виявлення
summary: Виявлення Bonjour/mDNS + налагодження (Beacon Gateway, клієнти та поширені режими збоїв)
title: Виявлення Bonjour
x-i18n:
    generated_at: "2026-04-23T20:52:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5d9099ce178aca1e6e443281133928f886de965245ad0fb02ce91a27aad3989
    source_path: gateway/bonjour.md
    workflow: 15
---

# Виявлення Bonjour / mDNS

OpenClaw використовує Bonjour (mDNS / DNS‑SD) для виявлення активного Gateway (кінцевої точки WebSocket).
Браузинг multicast `local.` — це **зручність лише для LAN**. Для виявлення між мережами той самий beacon
також можна публікувати через налаштований wide-area домен DNS-SD. Виявлення
як і раніше є best-effort і **не** замінює підключення через SSH або Tailnet.

## Wide-area Bonjour (Unicast DNS-SD) через Tailscale

Якщо node і gateway перебувають у різних мережах, multicast mDNS не перетне
цю межу. Ви можете зберегти той самий UX виявлення, перемкнувшись на **unicast DNS‑SD**
("Wide‑Area Bonjour") через Tailscale.

Загальні кроки:

1. Запустіть DNS-сервер на хості gateway (доступний через Tailnet).
2. Опублікуйте записи DNS‑SD для `_openclaw-gw._tcp` під окремою зоною
   (приклад: `openclaw.internal.`).
3. Налаштуйте Tailscale **split DNS**, щоб вибраний домен визначався через цей
   DNS-сервер для клієнтів (включно з iOS).

OpenClaw підтримує будь-який домен виявлення; `openclaw.internal.` — лише приклад.
Node iOS/Android переглядають і `local.`, і ваш налаштований wide-area домен.

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
- обслуговував вибраний вами домен (наприклад, `openclaw.internal.`) з `~/.openclaw/dns/<domain>.db`

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
`_openclaw-gw._tcp` у вашому домені виявлення без multicast.

### Безпека слухача Gateway (рекомендовано)

Порт WS Gateway (типово `18789`) типово прив’язується до loopback. Для доступу з LAN/tailnet
прив’яжіть його явно й не вимикайте автентифікацію.

Для конфігурацій лише з tailnet:

- Установіть `gateway.bind: "tailnet"` у `~/.openclaw/openclaw.json`.
- Перезапустіть Gateway (або перезапустіть застосунок menubar у macOS).

## Що рекламується

Лише Gateway рекламує `_openclaw-gw._tcp`.

## Типи сервісів

- `_openclaw-gw._tcp` — beacon транспорту gateway (використовується node macOS/iOS/Android).

## Ключі TXT (несекретні підказки)

Gateway рекламує невеликі несекретні підказки, щоб зробити UI-потоки зручнішими:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (WS + HTTP Gateway)
- `gatewayTls=1` (лише коли ввімкнено TLS)
- `gatewayTlsSha256=<sha256>` (лише коли ввімкнено TLS і доступний відбиток)
- `canvasPort=<port>` (лише коли ввімкнено хост canvas; наразі це той самий порт, що й `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (необов’язкова підказка, коли доступний Tailnet)
- `sshPort=<port>` (лише для повного режиму mDNS; wide-area DNS-SD може його не включати)
- `cliPath=<path>` (лише для повного режиму mDNS; wide-area DNS-SD все одно записує його як підказку для віддаленого встановлення)

Примітки щодо безпеки:

- TXT-записи Bonjour/mDNS є **неавтентифікованими**. Клієнти не повинні вважати TXT авторитетним джерелом маршрутизації.
- Клієнти повинні маршрутизувати за допомогою визначеної кінцевої точки сервісу (SRV + A/AAAA). Сприймайте `lanHost`, `tailnetDns`, `gatewayPort` і `gatewayTlsSha256` лише як підказки.
- Автонацілювання SSH так само має використовувати визначений хост сервісу, а не підказки лише з TXT.
- TLS pinning ніколи не повинен дозволяти рекламованому `gatewayTlsSha256` перевизначати раніше збережений pin.
- Node iOS/Android повинні вважати прямі підключення на основі виявлення **лише TLS** і вимагати явного підтвердження користувача перед довірою до відбитка, побаченого вперше.

## Налагодження на macOS

Корисні вбудовані інструменти:

- Перегляд екземплярів:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Визначення одного екземпляра (замініть `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Якщо перегляд працює, але визначення не вдається, зазвичай це означає політику LAN або
проблему з резолвером mDNS.

## Налагодження в журналах Gateway

Gateway записує циклічний файл журналу (під час запуску виводиться як
`gateway log file: ...`). Шукайте рядки `bonjour:`, особливо:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

## Налагодження на iOS node

iOS node використовує `NWBrowser` для виявлення `_openclaw-gw._tcp`.

Щоб зібрати журнали:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → відтворіть проблему → **Copy**

Журнал включає переходи стану браузера та зміни набору результатів.

## Поширені режими збоїв

- **Bonjour не працює між мережами**: використовуйте Tailnet або SSH.
- **Multicast заблоковано**: деякі мережі Wi‑Fi вимикають mDNS.
- **Сон / зміна інтерфейсів**: macOS може тимчасово втрачати результати mDNS; повторіть спробу.
- **Перегляд працює, але визначення не вдається**: використовуйте прості назви машин (уникайте emoji або
  розділових знаків), а потім перезапустіть Gateway. Назва екземпляра сервісу формується з
  імені хоста, тому надто складні назви можуть плутати деякі резолвери.

## Екрановані назви екземплярів (`\032`)

Bonjour/DNS‑SD часто екранує байти в назвах екземплярів сервісу як десяткові послідовності `\DDD`
(наприклад, пробіли стають `\032`).

- Це нормально на рівні протоколу.
- UI має декодувати це для відображення (iOS використовує `BonjourEscapes.decode`).

## Вимкнення / конфігурація

- `OPENCLAW_DISABLE_BONJOUR=1` вимикає рекламу (застаріле: `OPENCLAW_DISABLE_BONJOUR`).
- `gateway.bind` у `~/.openclaw/openclaw.json` керує режимом прив’язки Gateway.
- `OPENCLAW_SSH_PORT` перевизначає порт SSH, коли рекламується `sshPort` (застаріле: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` публікує підказку MagicDNS у TXT (застаріле: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` перевизначає рекламований шлях CLI (застаріле: `OPENCLAW_CLI_PATH`).

## Пов’язана документація

- Політика виявлення та вибір транспорту: [Виявлення](/uk/gateway/discovery)
- Pairing node + підтвердження: [Pairing Gateway](/uk/gateway/pairing)
