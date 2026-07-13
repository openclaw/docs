---
read_when:
    - Вы хотите подключить OpenClaw к WeChat или Weixin
    - Вы устанавливаете плагин канала openclaw-weixin или устраняете неполадки в его работе
    - Вам нужно понимать, как внешние плагины каналов работают параллельно с Gateway
summary: Настройка канала WeChat с помощью внешнего плагина openclaw-weixin
title: WeChat
x-i18n:
    generated_at: "2026-07-13T17:54:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 98faf95f9fb76deedb7df9adf3092083722a77bdd793de98c41a6f715cc0d14a
    source_path: channels/wechat.md
    workflow: 16
---

OpenClaw подключается к WeChat через внешний плагин канала
`@tencent-weixin/openclaw-weixin` от Tencent.

Статус: внешний плагин, поддерживаемый командой Tencent Weixin. Поддерживаются личные чаты и
медиафайлы. Групповые чаты не заявлены в метаданных возможностей плагина
(заявлена поддержка только личных чатов).

## Именование

- **WeChat** — название, используемое в пользовательской документации.
- **Weixin** — название, используемое в пакете Tencent и идентификаторе плагина.
- `openclaw-weixin` — идентификатор канала OpenClaw (`weixin` и `wechat` работают как псевдонимы).
- `@tencent-weixin/openclaw-weixin` — пакет npm.

Используйте `openclaw-weixin` в командах CLI и путях конфигурации.

## Принцип работы

Код WeChat не входит в основной репозиторий OpenClaw. OpenClaw предоставляет
универсальный контракт плагина канала, а внешний плагин реализует
среду выполнения для WeChat:

1. `openclaw plugins install` устанавливает `@tencent-weixin/openclaw-weixin`.
2. Gateway обнаруживает манифест плагина и загружает его точку входа.
3. Плагин регистрирует идентификатор канала `openclaw-weixin`.
4. `openclaw channels login --channel openclaw-weixin` запускает вход по QR-коду.
5. Плагин сохраняет учётные данные аккаунта в каталоге состояния OpenClaw
   (по умолчанию `~/.openclaw`).
6. При запуске Gateway плагин запускает монитор Weixin для каждого
   настроенного аккаунта.
7. Входящие сообщения WeChat нормализуются через контракт канала, направляются
   выбранному агенту OpenClaw и отправляются обратно через исходящий путь плагина.

Это разделение важно: ядро OpenClaw остаётся независимым от конкретных каналов. Вход в WeChat,
вызовы Tencent iLink API, отправка и загрузка медиафайлов, токены контекста и
мониторинг аккаунтов относятся к внешнему плагину.

## Установка

Быстрая установка:

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

Установка вручную:

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

После установки перезапустите Gateway:

```bash
openclaw gateway restart
```

## Вход

Запустите вход по QR-коду на том же компьютере, где работает Gateway:

```bash
openclaw channels login --channel openclaw-weixin
```

Отсканируйте QR-код приложением WeChat на телефоне и подтвердите вход. После успешного
сканирования плагин сохраняет токен аккаунта локально.

Чтобы добавить ещё один аккаунт WeChat, снова выполните ту же команду входа. При использовании
нескольких аккаунтов изолируйте сеансы личных сообщений по аккаунту, каналу и отправителю:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## Управление доступом

Для личных сообщений используется стандартная модель OpenClaw с сопряжением и списком разрешённых
отправителей для плагинов каналов.

Разрешите доступ новым отправителям:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

Полное описание модели управления доступом см. в разделе [Сопряжение](/ru/channels/pairing).

## Совместимость

При запуске плагин проверяет версию OpenClaw на хосте.

| Линейка плагина | Версия OpenClaw                                                | Тег npm  |
| ----------- | --------------------------------------------------------------- | -------- |
| `2.x`       | `>=2026.5.12` (текущая 2.4.6; ранние версии 2.x поддерживали `>=2026.3.22`) | `latest` |
| `1.x`       | `>=2026.1.0 <2026.3.22`                                         | `legacy` |

Если плагин сообщает, что ваша версия OpenClaw слишком старая, обновите
OpenClaw или установите устаревшую линейку плагина:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Вспомогательный процесс

При мониторинге Tencent iLink API плагин WeChat может выполнять вспомогательные
задачи параллельно с Gateway. В задаче #68451 этот вспомогательный путь выявил ошибку
в универсальной очистке устаревших процессов Gateway в OpenClaw: дочерний процесс мог попытаться
завершить родительский процесс Gateway, вызывая циклические перезапуски под управлением
таких диспетчеров процессов, как systemd.

Текущая очистка при запуске OpenClaw исключает текущий процесс и его предков,
поэтому вспомогательный процесс канала не может завершить запустивший его Gateway. Это
универсальное исправление, а не отдельная логика WeChat в ядре.

## Устранение неполадок

Проверьте установку и состояние:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

Если канал отображается как установленный, но не подключается, убедитесь, что плагин
включён, и выполните перезапуск:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

Если после включения WeChat Gateway постоянно перезапускается, обновите OpenClaw и
плагин:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

Если при запуске сообщается, что установленный пакет плагина `requires compiled runtime
output for TypeScript entry`, пакет npm был опубликован без скомпилированных
файлов среды выполнения JavaScript, необходимых OpenClaw. Выполните обновление или переустановку после того, как
издатель плагина выпустит исправленный пакет, либо временно отключите или удалите плагин.

Временное отключение:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## Связанная документация

- Обзор каналов: [Каналы чата](/ru/channels)
- Сопряжение: [Сопряжение](/ru/channels/pairing)
- Маршрутизация каналов: [Маршрутизация каналов](/ru/channels/channel-routing)
- Архитектура плагинов: [Архитектура плагинов](/ru/plugins/architecture)
- SDK плагинов каналов: [SDK плагинов каналов](/ru/plugins/sdk-channel-plugins)
- Внешний пакет: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
