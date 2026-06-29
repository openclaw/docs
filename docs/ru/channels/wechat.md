---
read_when:
    - Вы хотите подключить OpenClaw к WeChat или Weixin
    - Вы устанавливаете или устраняете неполадки Plugin канала openclaw-weixin
    - Нужно понимать, как внешние плагины каналов выполняются рядом с Gateway
summary: Настройка канала WeChat через внешний Plugin openclaw-weixin
title: WeChat
x-i18n:
    generated_at: "2026-06-28T22:38:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 803557a4fc92056c63053a3388100a451b2d85d4e892877707b3c2e3a677c0b0
    source_path: channels/wechat.md
    workflow: 16
---

OpenClaw подключается к WeChat через внешний Plugin канала
`@tencent-weixin/openclaw-weixin` от Tencent.

Статус: внешний Plugin. Поддерживаются личные чаты и медиа. Групповые чаты не
заявлены в текущих метаданных возможностей Plugin.

## Именование

- **WeChat** — пользовательское название в этой документации.
- **Weixin** — название, используемое пакетом Tencent и идентификатором Plugin.
- `openclaw-weixin` — идентификатор канала OpenClaw.
- `@tencent-weixin/openclaw-weixin` — npm-пакет.

Используйте `openclaw-weixin` в командах CLI и путях конфигурации.

## Как это работает

Код WeChat не находится в основном репозитории OpenClaw. OpenClaw предоставляет
общий контракт Plugin канала, а внешний Plugin предоставляет
среду выполнения, специфичную для WeChat:

1. `openclaw plugins install` устанавливает `@tencent-weixin/openclaw-weixin`.
2. Gateway обнаруживает манифест Plugin и загружает точку входа Plugin.
3. Plugin регистрирует идентификатор канала `openclaw-weixin`.
4. `openclaw channels login --channel openclaw-weixin` запускает вход по QR-коду.
5. Plugin сохраняет учетные данные аккаунта в каталоге состояния OpenClaw.
6. Когда Gateway запускается, Plugin запускает монитор Weixin для каждого
   настроенного аккаунта.
7. Входящие сообщения WeChat нормализуются через контракт канала, направляются
   выбранному агенту OpenClaw и отправляются обратно через исходящий путь Plugin.

Это разделение важно: ядро OpenClaw должно оставаться независимым от каналов.
Вход в WeChat, вызовы Tencent iLink API, выгрузка/загрузка медиа, токены
контекста и мониторинг аккаунтов принадлежат внешнему Plugin.

## Установка

Быстрая установка:

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

Ручная установка:

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

Перезапустите Gateway после установки:

```bash
openclaw gateway restart
```

## Вход

Запустите вход по QR-коду на той же машине, где работает Gateway:

```bash
openclaw channels login --channel openclaw-weixin
```

Отсканируйте QR-код с помощью WeChat на телефоне и подтвердите вход. Plugin
сохраняет токен аккаунта локально после успешного сканирования.

Чтобы добавить еще один аккаунт WeChat, снова выполните ту же команду входа. Для
нескольких аккаунтов изолируйте сеансы личных сообщений по аккаунту, каналу и
отправителю:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## Контроль доступа

Личные сообщения используют обычную модель привязки и списка разрешенных
OpenClaw для Plugin каналов.

Одобрите новых отправителей:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

Полную модель контроля доступа см. в разделе [Привязка](/ru/channels/pairing).

## Совместимость

Plugin проверяет версию хоста OpenClaw при запуске.

| Линейка Plugin | Версия OpenClaw         | npm-тег  |
| -------------- | ----------------------- | -------- |
| `2.x`          | `>=2026.3.22`           | `latest` |
| `1.x`          | `>=2026.1.0 <2026.3.22` | `legacy` |

Если Plugin сообщает, что ваша версия OpenClaw слишком старая, либо обновите
OpenClaw, либо установите устаревшую линейку Plugin:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Вспомогательный процесс

Plugin WeChat может выполнять вспомогательную работу рядом с Gateway, пока он
отслеживает Tencent iLink API. В issue #68451 этот вспомогательный путь выявил
ошибку в общей очистке устаревших Gateway в OpenClaw: дочерний процесс мог
попытаться очистить родительский процесс Gateway, вызывая циклы перезапуска под
менеджерами процессов, такими как systemd.

Текущая очистка при запуске OpenClaw исключает текущий процесс и его предков,
поэтому вспомогательный процесс канала не должен завершать Gateway, который его
запустил. Это исправление общее; это не путь, специфичный для WeChat, в ядре.

## Устранение неполадок

Проверьте установку и статус:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

Если канал отображается как установленный, но не подключается, подтвердите, что
Plugin включен, и перезапустите:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

Если Gateway многократно перезапускается после включения WeChat, обновите и
OpenClaw, и Plugin:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

Если при запуске сообщается, что установленный пакет Plugin `requires compiled runtime
output for TypeScript entry`, npm-пакет был опубликован без скомпилированных
файлов среды выполнения JavaScript, необходимых OpenClaw. Обновите/переустановите
после того, как издатель Plugin выпустит исправленный пакет, или временно
отключите/удалите Plugin.

Временное отключение:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## Связанная документация

- Обзор каналов: [Чат-каналы](/ru/channels)
- Привязка: [Привязка](/ru/channels/pairing)
- Маршрутизация каналов: [Маршрутизация каналов](/ru/channels/channel-routing)
- Архитектура Plugin: [Архитектура Plugin](/ru/plugins/architecture)
- SDK Plugin канала: [SDK Plugin канала](/ru/plugins/sdk-channel-plugins)
- Внешний пакет: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
