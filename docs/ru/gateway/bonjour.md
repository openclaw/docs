---
read_when:
    - Отладка проблем обнаружения Bonjour на macOS/iOS
    - Изменение типов служб mDNS, TXT-записей или UX обнаружения
summary: Обнаружение Bonjour/mDNS и отладка (маяки Gateway, клиенты и типичные режимы отказа)
title: Обнаружение Bonjour
x-i18n:
    generated_at: "2026-06-28T22:54:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05892ee8f0dc880f68f7cf024de9452b8d999ff1af3c7ca9850fb4f2d732af0c
    source_path: gateway/bonjour.md
    workflow: 16
---

OpenClaw может использовать Bonjour (mDNS / DNS-SD) для обнаружения активного Gateway (конечной точки WebSocket).
Обзор multicast `local.` — это **удобство только для LAN**. Встроенный Plugin `bonjour`
отвечает за LAN-анонсирование. Он автоматически запускается на хостах macOS и включается явно в
Linux, Windows и контейнеризированных развертываниях Gateway. Для обнаружения между сетями тот же
beacon также можно публиковать через настроенный wide-area домен DNS-SD. Обнаружение
по-прежнему работает по принципу best-effort и **не** заменяет подключение через SSH или Tailnet.

## Wide-area Bonjour (Unicast DNS-SD) через Tailscale

Если узел и Gateway находятся в разных сетях, multicast mDNS не пройдет через
границу. Можно сохранить тот же UX обнаружения, переключившись на **unicast DNS-SD**
("Wide-Area Bonjour") через Tailscale.

Общие шаги:

1. Запустите DNS-сервер на хосте Gateway (доступном через Tailnet).
2. Опубликуйте записи DNS-SD для `_openclaw-gw._tcp` в выделенной зоне
   (пример: `openclaw.internal.`).
3. Настройте **split DNS** в Tailscale, чтобы выбранный домен разрешался через этот
   DNS-сервер для клиентов (включая iOS).

OpenClaw поддерживает любой домен обнаружения; `openclaw.internal.` — только пример.
Узлы iOS/Android просматривают и `local.`, и настроенный wide-area домен.

### Конфигурация Gateway (рекомендуется)

```json5
{
  gateway: { bind: "tailnet" }, // tailnet-only (recommended)
  discovery: { wideArea: { enabled: true } }, // enables wide-area DNS-SD publishing
}
```

### Однократная настройка DNS-сервера (хост Gateway)

```bash
openclaw dns setup --apply
```

Это устанавливает CoreDNS и настраивает его так, чтобы он:

- слушал порт 53 только на интерфейсах Tailscale у Gateway
- обслуживал выбранный домен (пример: `openclaw.internal.`) из `~/.openclaw/dns/<domain>.db`

Проверьте с машины, подключенной к Tailnet:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Настройки DNS в Tailscale

В консоли администратора Tailscale:

- Добавьте nameserver, указывающий на tailnet IP Gateway (UDP/TCP 53).
- Добавьте split DNS, чтобы домен обнаружения использовал этот nameserver.

После того как клиенты примут DNS Tailnet, узлы iOS и обнаружение CLI смогут просматривать
`_openclaw-gw._tcp` в вашем домене обнаружения без multicast.

### Безопасность слушателя Gateway (рекомендуется)

Порт WS Gateway (по умолчанию `18789`) по умолчанию привязывается к loopback. Для доступа из LAN/tailnet
явно задайте привязку и оставьте аутентификацию включенной.

Для конфигураций только через tailnet:

- Установите `gateway.bind: "tailnet"` в `~/.openclaw/openclaw.json`.
- Перезапустите Gateway (или перезапустите приложение строки меню macOS).

## Что анонсируется

Только Gateway анонсирует `_openclaw-gw._tcp`. LAN multicast-анонсирование
предоставляется встроенным Plugin `bonjour`, когда Plugin включен; wide-area
публикация DNS-SD остается в зоне ответственности Gateway.

## Типы сервисов

- `_openclaw-gw._tcp` - beacon транспорта Gateway (используется узлами macOS/iOS/Android).

## Ключи TXT (несекретные подсказки)

Gateway анонсирует небольшие несекретные подсказки, чтобы упростить UI-потоки:

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>` (Gateway WS + HTTP)
- `gatewayTls=1` (только когда TLS включен)
- `gatewayTlsSha256=<sha256>` (только когда TLS включен и fingerprint доступен)
- `canvasPort=<port>` (только когда хост canvas включен; сейчас совпадает с `gatewayPort`)
- `transport=gateway`
- `tailnetDns=<magicdns>` (только полный режим mDNS, необязательная подсказка, когда Tailnet доступен)
- `sshPort=<port>` (только полный режим; отсутствует в минимальном и выключенном режимах)
- `cliPath=<path>` (только полный режим; отсутствует в минимальном и выключенном режимах)

Примечания по безопасности:

- Записи TXT Bonjour/mDNS **не аутентифицированы**. Клиенты не должны считать TXT авторитетным источником маршрутизации.
- Клиенты должны маршрутизировать через разрешенную конечную точку сервиса (SRV + A/AAAA). Считайте `lanHost`, `tailnetDns`, `gatewayPort` и `gatewayTlsSha256` только подсказками.
- Автоматический выбор SSH-цели также должен использовать разрешенный хост сервиса, а не только подсказки TXT.
- TLS pinning никогда не должен позволять анонсированному `gatewayTlsSha256` переопределять ранее сохраненный pin.
- Узлы iOS/Android должны считать прямые подключения на основе обнаружения **только TLS** и требовать явного подтверждения пользователя перед доверием первому fingerprint.

## Отладка на macOS

Полезные встроенные инструменты:

- Просмотреть экземпляры:

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- Разрешить один экземпляр (замените `<instance>`):

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

Если просмотр работает, а разрешение нет, обычно причина в политике LAN или
проблеме резолвера mDNS.

## Отладка в логах Gateway

Gateway пишет rolling log file (при запуске выводится как
`gateway log file: ...`). Ищите строки `bonjour:`, особенно:

- `bonjour: advertise failed ...`
- `bonjour: suppressing ciao cancellation ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

Watchdog считает активные состояния `probing`, `announcing` и свежие conflict-renames
состояниями в процессе выполнения. Если сервис так и не достигает `announced`, OpenClaw в итоге
пересоздает advertiser и после повторяющихся сбоев отключает Bonjour для этого
процесса Gateway вместо бесконечного повторного анонсирования.

Bonjour использует системное имя хоста для анонсируемого хоста `.local`, когда оно является
допустимой DNS-меткой. Если системное имя хоста содержит пробелы, подчеркивания или другой
недопустимый символ DNS-метки, OpenClaw откатывается к `openclaw.local`. Задайте
`OPENCLAW_MDNS_HOSTNAME=<name>` перед запуском Gateway, когда нужна
явная метка хоста.

## Отладка на узле iOS

Узел iOS использует `NWBrowser` для обнаружения `_openclaw-gw._tcp`.

Чтобы собрать логи:

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → воспроизведите → **Copy**

Лог включает переходы состояний browser и изменения набора результатов.

## Когда включать Bonjour

Bonjour автоматически запускается при старте Gateway с пустой конфигурацией на хостах macOS, потому что
локальное приложение и близлежащие узлы iOS/Android обычно зависят от обнаружения в той же LAN.

Включайте Bonjour явно, когда автоматическое обнаружение в той же LAN полезно в Linux,
Windows или на другом хосте не macOS:

```bash
openclaw plugins enable bonjour
```

Когда Bonjour включен, он использует `discovery.mdns.mode`, чтобы решить, сколько метаданных TXT
публиковать. Тот же режим управляет необязательными TXT-подсказками в wide-area записях DNS-SD.
Режим по умолчанию — `minimal`; используйте `full` только когда клиентам нужны подсказки `cliPath` или
`sshPort`. Используйте `off`, чтобы подавить LAN multicast без изменения включения Plugin;
wide-area DNS-SD все еще может публиковать минимальный beacon Gateway, когда
`discovery.wideArea.enabled` равно true.

## Когда отключать Bonjour

Оставляйте Bonjour отключенным, когда LAN multicast-анонсирование не нужно, недоступно
или вредно. Типичные случаи — серверы не macOS, сеть Docker bridge,
WSL или сетевая политика, которая отбрасывает multicast mDNS. В таких средах
Gateway по-прежнему доступен через опубликованный URL, SSH, Tailnet или wide-area
DNS-SD, но LAN-автообнаружение ненадежно.

Предпочитайте существующее переопределение через окружение, когда проблема относится к развертыванию:

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

Это отключает LAN multicast-анонсирование без изменения конфигурации Plugin.
Это безопасно для образов Docker, service-файлов, скриптов запуска и разовой
отладки, потому что настройка исчезает вместе с окружением.

Используйте конфигурацию Plugin, когда намеренно хотите выключить встроенный LAN
Plugin обнаружения для этой конфигурации OpenClaw:

```bash
openclaw plugins disable bonjour
```

## Особенности Docker

Встроенный Plugin Bonjour автоматически отключает LAN multicast-анонсирование в обнаруженных
контейнерах, когда `OPENCLAW_DISABLE_BONJOUR` не задан. Сети Docker bridge
обычно не пересылают multicast mDNS (`224.0.0.251:5353`) между контейнером
и LAN, поэтому анонсирование из контейнера редко заставляет обнаружение работать.

Важные особенности:

- Bonjour автоматически запускается на хостах macOS и включается явно в остальных средах. Если оставить его
  отключенным, Gateway не остановится; будет пропущено только LAN multicast-анонсирование.
- Отключение Bonjour не меняет `gateway.bind`; Docker по-прежнему по умолчанию использует
  `OPENCLAW_GATEWAY_BIND=lan`, чтобы опубликованный порт хоста мог работать.
- Отключение Bonjour не отключает wide-area DNS-SD. Используйте wide-area discovery
  или Tailnet, когда Gateway и узел находятся не в одной LAN.
- Повторное использование того же `OPENCLAW_CONFIG_DIR` вне Docker не сохраняет
  политику автоотключения контейнера.
- Задавайте `OPENCLAW_DISABLE_BONJOUR=0` только для host networking, macvlan или другой
  сети, где известно, что multicast mDNS проходит; задавайте `1` для принудительного отключения.

## Устранение неполадок отключенного Bonjour

Если узел больше не обнаруживает Gateway автоматически после настройки Docker:

1. Проверьте, в каком режиме работает Gateway: auto, forced-on или forced-off:

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. Проверьте, что сам Gateway доступен через опубликованный порт:

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. Используйте прямую цель, когда Bonjour отключен:
   - Control UI или локальные инструменты: `http://127.0.0.1:18789`
   - LAN-клиенты: `http://<gateway-host>:18789`
   - Клиенты между сетями: Tailnet MagicDNS, Tailnet IP, SSH tunnel или
     wide-area DNS-SD

4. Если вы намеренно включили Plugin Bonjour в Docker и принудительно включили анонсирование
   через `OPENCLAW_DISABLE_BONJOUR=0`, проверьте multicast с хоста:

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   Если просмотр пуст или логи Gateway показывают повторяющиеся отмены ciao watchdog,
   восстановите `OPENCLAW_DISABLE_BONJOUR=1` и используйте прямой маршрут или
   маршрут Tailnet.

## Распространенные режимы отказа

- **Bonjour не пересекает сети**: используйте Tailnet или SSH.
- **Multicast заблокирован**: некоторые сети Wi-Fi отключают mDNS.
- **Advertiser завис в probing/announcing**: хосты с заблокированным multicast,
  контейнерные bridge-сети, WSL или смена интерфейсов могут оставить advertiser ciao в
  состоянии non-announced. OpenClaw повторяет попытки несколько раз, а затем отключает Bonjour
  для текущего процесса Gateway вместо бесконечного перезапуска advertiser.
- **Сеть Docker bridge**: Bonjour автоматически отключается в обнаруженных контейнерах.
  Задавайте `OPENCLAW_DISABLE_BONJOUR=0` только для host, macvlan или другой
  сети с поддержкой mDNS.
- **Сон / смена интерфейсов**: macOS может временно терять результаты mDNS; повторите попытку.
- **Просмотр работает, но разрешение завершается ошибкой**: используйте простые имена машин (избегайте emoji и
  пунктуации), затем перезапустите Gateway. Имя экземпляра сервиса производно от
  имени хоста, поэтому слишком сложные имена могут сбивать с толку некоторые резолверы.

## Экранированные имена экземпляров (`\032`)

Bonjour/DNS-SD часто экранирует байты в именах экземпляров сервисов как десятичные
последовательности `\DDD` (например, пробелы становятся `\032`).

- Это нормально на уровне протокола.
- UI должны декодировать для отображения (iOS использует `BonjourEscapes.decode`).

## Включение / отключение / конфигурация

- Хосты macOS по умолчанию автоматически запускают встроенный Plugin обнаружения в LAN.
- `openclaw plugins enable bonjour` включает встроенный Plugin обнаружения в LAN на хостах, где он не включен по умолчанию.
- `openclaw plugins disable bonjour` отключает многоадресную рекламу LAN, отключая встроенный Plugin.
- `OPENCLAW_DISABLE_BONJOUR=1` отключает многоадресную рекламу LAN без изменения конфигурации Plugin; допустимые истинные значения: `1`, `true`, `yes` и `on` (устаревшее: `OPENCLAW_DISABLE_BONJOUR`).
- `OPENCLAW_DISABLE_BONJOUR=0` принудительно включает многоадресную рекламу LAN, включая обнаруженные контейнеры; допустимые ложные значения: `0`, `false`, `no` и `off`.
- Когда Bonjour Plugin включен, а `OPENCLAW_DISABLE_BONJOUR` не задан, Bonjour публикует рекламу на обычных хостах и автоматически отключается внутри обнаруженных контейнеров.
- `gateway.bind` в `~/.openclaw/openclaw.json` управляет режимом привязки Gateway.
- `OPENCLAW_SSH_PORT` переопределяет SSH-порт, когда публикуется `sshPort` (устаревшее: `OPENCLAW_SSH_PORT`).
- `OPENCLAW_TAILNET_DNS` публикует подсказку MagicDNS в TXT, когда включен полный режим mDNS (устаревшее: `OPENCLAW_TAILNET_DNS`).
- `OPENCLAW_CLI_PATH` переопределяет публикуемый путь CLI (устаревшее: `OPENCLAW_CLI_PATH`).

## Связанные документы

- Политика обнаружения и выбор транспорта: [Обнаружение](/ru/gateway/discovery)
- Сопряжение Node + подтверждения: [Сопряжение Gateway](/ru/gateway/pairing)
