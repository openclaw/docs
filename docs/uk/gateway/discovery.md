---
read_when:
    - Реалізація або зміна виявлення/оголошення Bonjour
    - Налаштування режимів віддаленого підключення (пряме чи SSH)
    - Проєктування виявлення Node і pairing для віддалених Node
summary: Виявлення Node і транспорти (Bonjour, Tailscale, SSH) для пошуку gateway
title: Виявлення й транспорти
x-i18n:
    generated_at: "2026-04-23T20:52:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6147df94d5801cdfe3f518b2523de7d1175261c579990afa4857bd6c0e0bfbb6
    source_path: gateway/discovery.md
    workflow: 15
---

# Виявлення й транспорти

В OpenClaw є дві різні задачі, які зовні виглядають схожими:

1. **Віддалене керування оператором**: застосунок macOS у рядку меню керує gateway, що працює деінде.
2. **Pairing Node**: iOS/Android (і майбутні Node) знаходять gateway і безпечно виконують pairing.

Мета дизайну — тримати все мережеве виявлення/оголошення в **Node Gateway** (`openclaw gateway`), а клієнти (mac app, iOS) залишити лише споживачами.

## Терміни

- **Gateway**: один довготривалий процес gateway, який володіє станом (сесії, pairing, реєстр Node) і запускає канали. У більшості сценаріїв використовується один на хост; можливі ізольовані сценарії з кількома gateway.
- **Gateway WS (control plane)**: endpoint WebSocket на `127.0.0.1:18789` типово; може бути прив’язаний до LAN/tailnet через `gateway.bind`.
- **Direct WS transport**: endpoint Gateway WS, доступний у LAN/tailnet (без SSH).
- **SSH transport (fallback)**: віддалене керування шляхом пересилання `127.0.0.1:18789` через SSH.
- **Legacy TCP bridge (видалено)**: старіший транспорт Node (див.
  [Bridge protocol](/uk/gateway/bridge-protocol)); більше не оголошується для
  виявлення й більше не є частиною поточних збірок.

Деталі протоколів:

- [Gateway protocol](/uk/gateway/protocol)
- [Bridge protocol (legacy)](/uk/gateway/bridge-protocol)

## Чому ми зберігаємо і "direct", і SSH

- **Direct WS** дає найкращий UX в одній мережі та в межах tailnet:
  - автовиявлення в LAN через Bonjour
  - токени pairing + ACL, якими володіє gateway
  - не потребує shell-доступу; поверхня протоколу може лишатися вузькою й придатною до аудиту
- **SSH** залишається універсальним fallback:
  - працює всюди, де у вас є SSH-доступ (навіть через непов’язані мережі)
  - переживає проблеми multicast/mDNS
  - не потребує жодних нових вхідних портів, крім SSH

## Входи виявлення (як клієнти дізнаються, де gateway)

### 1) Виявлення Bonjour / DNS-SD

Multicast Bonjour працює в режимі best-effort і не перетинає межі мереж. OpenClaw також може переглядати
той самий beacon gateway через налаштований wide-area DNS-SD domain, тому виявлення може охоплювати:

- `local.` в тій самій LAN
- налаштований unicast DNS-SD domain для виявлення між мережами

Напрямок цілі:

- **gateway** оголошує свій endpoint WS через Bonjour.
- Клієнти переглядають і показують список “оберіть gateway”, а потім зберігають вибраний endpoint.

Деталі усунення несправностей і beacon: [Bonjour](/uk/gateway/bonjour).

#### Деталі service beacon

- Типи service:
  - `_openclaw-gw._tcp` (transport beacon gateway)
- TXT-ключі (без секретів):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (зрозуміла назва, налаштована оператором)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (лише коли TLS увімкнено)
  - `gatewayTlsSha256=<sha256>` (лише коли TLS увімкнено і fingerprint доступний)
  - `canvasPort=<port>` (порт canvas host; наразі той самий, що й `gatewayPort`, коли canvas host увімкнено)
  - `tailnetDns=<magicdns>` (необов’язкова підказка; автовизначається, коли доступний Tailscale)
  - `sshPort=<port>` (лише в режимі mDNS full; wide-area DNS-SD може його пропускати, тоді типові значення SSH лишаються `22`)
  - `cliPath=<path>` (лише в режимі mDNS full; wide-area DNS-SD все одно записує його як підказку для віддаленого встановлення)

Примітки щодо безпеки:

- TXT-записи Bonjour/mDNS **неавтентифіковані**. Клієнти мають сприймати значення TXT лише як UX-підказки.
- Для маршрутизації (host/port) слід надавати перевагу **розв’язаному endpoint service** (SRV + A/AAAA), а не значенням `lanHost`, `tailnetDns` чи `gatewayPort`, наданим через TXT.
- TLS pinning ніколи не повинен дозволяти оголошеному `gatewayTlsSha256` перевизначити раніше збережений pin.
- iOS/Android Node повинні вимагати явного підтвердження “довіряти цьому fingerprint” перед збереженням pin при першому підключенні (перевірка поза каналом), коли вибраний маршрут є безпечним / базується на TLS.

Вимкнення/перевизначення:

- `OPENCLAW_DISABLE_BONJOUR=1` вимикає оголошення.
- `gateway.bind` у `~/.openclaw/openclaw.json` керує режимом прив’язки Gateway.
- `OPENCLAW_SSH_PORT` перевизначає порт SSH, що оголошується, коли виводиться `sshPort`.
- `OPENCLAW_TAILNET_DNS` публікує підказку `tailnetDns` (MagicDNS).
- `OPENCLAW_CLI_PATH` перевизначає оголошений шлях CLI.

### 2) Tailnet (між мережами)

Для сценаріїв у стилі London/Vienna Bonjour не допоможе. Рекомендована ціль “direct”:

- ім’я Tailscale MagicDNS (бажано) або стабільна tailnet IP-адреса.

Якщо gateway може визначити, що він працює під Tailscale, він публікує `tailnetDns` як необов’язкову підказку для клієнтів (включно з wide-area beacons).

macOS app тепер надає перевагу іменам MagicDNS замість сирих IP Tailscale для виявлення gateway. Це підвищує надійність, коли IP tailnet змінюються (наприклад, після перезапусків Node або перевидачі CGNAT), оскільки імена MagicDNS автоматично розв’язуються в поточну IP-адресу.

Для pairing мобільних Node підказки виявлення не послаблюють безпеку транспорту на маршрутах tailnet/public:

- iOS/Android однаково вимагають безпечний шлях першого підключення через tailnet/public (`wss://` або Tailscale Serve/Funnel).
- Виявлена сира tailnet IP — це підказка для маршрутизації, а не дозвіл використовувати відкритий віддалений `ws://`.
- Пряме підключення `ws://` у приватній LAN, як і раніше, підтримується.
- Якщо вам потрібен найпростіший шлях Tailscale для мобільних Node, використовуйте Tailscale Serve, щоб і виявлення, і код налаштування розв’язувалися до того самого безпечного endpoint MagicDNS.

### 3) Ручна / SSH-ціль

Коли немає direct-маршруту (або direct вимкнено), клієнти завжди можуть підключитися через SSH, переславши loopback-порт gateway.

Див. [Remote access](/uk/gateway/remote).

## Вибір транспорту (політика клієнта)

Рекомендована поведінка клієнта:

1. Якщо налаштовано й доступний paired direct endpoint, використовуйте його.
2. Інакше, якщо виявлення знаходить gateway в `local.` або в налаштованому wide-area domain, запропонуйте вибір “Use this gateway” в один дотик і збережіть його як direct endpoint.
3. Інакше, якщо налаштовано DNS/IP tailnet, спробуйте direct.
   Для мобільних Node на маршрутах tailnet/public direct означає безпечний endpoint, а не віддалений відкритий `ws://`.
4. Інакше перейдіть до SSH.

## Pairing + auth (direct transport)

Gateway є джерелом істини для допуску Node/клієнтів.

- Запити pairing створюються/схвалюються/відхиляються в gateway (див. [Gateway pairing](/uk/gateway/pairing)).
- Gateway забезпечує:
  - auth (token / keypair)
  - scopes/ACL (gateway — не сирий proxy до кожного методу)
  - обмеження швидкості

## Відповідальність за компонентами

- **Gateway**: оголошує beacons виявлення, володіє рішеннями pairing і хостить endpoint WS.
- **macOS app**: допомагає вибрати gateway, показує запити pairing і використовує SSH лише як fallback.
- **iOS/Android Node**: переглядають Bonjour як зручний варіант і підключаються до paired Gateway WS.
