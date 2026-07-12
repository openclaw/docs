---
read_when:
    - Вы хотите подключить OpenClaw к WeChat или Weixin
    - Вы устанавливаете или устраняете неполадки плагина канала openclaw-weixin
    - Вам нужно понимать, как внешние плагины каналов работают рядом с Gateway
summary: Настройка канала WeChat с помощью внешнего плагина openclaw-weixin
title: WeChat
x-i18n:
    generated_at: "2026-07-12T11:13:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98faf95f9fb76deedb7df9adf3092083722a77bdd793de98c41a6f715cc0d14a
    source_path: channels/wechat.md
    workflow: 16
---

OpenClaw подключается к WeChat через внешний Plugin канала Tencent
`@tencent-weixin/openclaw-weixin`.

Статус: внешний Plugin, поддерживаемый командой Tencent Weixin. Поддерживаются личные чаты и
медиафайлы. Групповые чаты не заявлены в метаданных возможностей Plugin
(заявлена поддержка только личных чатов).

## Названия

- **WeChat** — название, используемое в этой документации для пользователей.
- **Weixin** — название, используемое в пакете Tencent и идентификаторе Plugin.
- `openclaw-weixin` — идентификатор канала OpenClaw (`weixin` и `wechat` работают как псевдонимы).
- `@tencent-weixin/openclaw-weixin` — пакет npm.

Используйте `openclaw-weixin` в командах CLI и путях конфигурации.

## Принцип работы

Код WeChat не находится в основном репозитории OpenClaw. OpenClaw предоставляет
универсальный контракт Plugin канала, а внешний Plugin реализует
среду выполнения для WeChat:

1. `openclaw plugins install` устанавливает `@tencent-weixin/openclaw-weixin`.
2. Gateway обнаруживает манифест Plugin и загружает его точку входа.
3. Plugin регистрирует идентификатор канала `openclaw-weixin`.
4. `openclaw channels login --channel openclaw-weixin` запускает вход по QR-коду.
5. Plugin сохраняет учетные данные аккаунта в каталоге состояния OpenClaw
   (по умолчанию `~/.openclaw`).
6. При запуске Gateway Plugin запускает монитор Weixin для каждого
   настроенного аккаунта.
7. Входящие сообщения WeChat нормализуются через контракт канала, направляются
   выбранному агенту OpenClaw, а ответы отправляются через исходящий путь Plugin.

Это разделение важно: ядро OpenClaw остается независимым от конкретных каналов. Вход в WeChat,
вызовы Tencent iLink API, отправка и скачивание медиафайлов, токены контекста и
мониторинг аккаунтов находятся в ведении внешнего Plugin.

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

Перезапустите Gateway после установки:

```bash
openclaw gateway restart
```

## Вход

Запустите вход по QR-коду на том же компьютере, где работает Gateway:

```bash
openclaw channels login --channel openclaw-weixin
```

Отсканируйте QR-код приложением WeChat на телефоне и подтвердите вход. После
успешного сканирования Plugin сохранит токен аккаунта локально.

Чтобы добавить еще один аккаунт WeChat, снова выполните ту же команду входа. При использовании
нескольких аккаунтов изолируйте сеансы личных сообщений по аккаунту, каналу и отправителю:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## Управление доступом

Для личных сообщений используется стандартная модель сопряжения и списка разрешений OpenClaw
для Plugin каналов.

Подтвердите новых отправителей:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

Полное описание модели управления доступом см. в разделе [Сопряжение](/ru/channels/pairing).

## Совместимость

При запуске Plugin проверяет версию хост-системы OpenClaw.

| Линия Plugin | Версия OpenClaw                                                | Тег npm  |
| ----------- | --------------------------------------------------------------- | -------- |
| `2.x`       | `>=2026.5.12` (текущая — 2.4.6; ранние версии 2.x поддерживали `>=2026.3.22`) | `latest` |
| `1.x`       | `>=2026.1.0 <2026.3.22`                                         | `legacy` |

Если Plugin сообщает, что ваша версия OpenClaw устарела, обновите
OpenClaw или установите устаревшую линию Plugin:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Вспомогательный процесс

Plugin WeChat может запускать вспомогательные задачи параллельно с Gateway во время мониторинга
Tencent iLink API. В задаче #68451 этот вспомогательный путь выявил ошибку в
универсальной очистке устаревших процессов Gateway в OpenClaw: дочерний процесс мог попытаться
завершить родительский процесс Gateway, вызывая циклы перезапуска под управлением таких
менеджеров процессов, как systemd.

Текущая очистка при запуске OpenClaw исключает текущий процесс и его предков,
поэтому вспомогательный процесс канала не может завершить запустивший его Gateway. Это
универсальное исправление; оно не является специфичным для WeChat путем в ядре.

## Устранение неполадок

Проверьте установку и состояние:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

Если канал отображается как установленный, но не подключается, убедитесь, что Plugin
включен, и выполните перезапуск:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

Если после включения WeChat Gateway постоянно перезапускается, обновите OpenClaw и
Plugin:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

Если при запуске сообщается, что установленному пакету Plugin `requires compiled runtime
output for TypeScript entry`, пакет npm был опубликован без скомпилированных
файлов среды выполнения JavaScript, необходимых OpenClaw. Обновите или переустановите Plugin после того, как
издатель выпустит исправленный пакет, либо временно отключите или удалите Plugin.

Временное отключение:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## Связанная документация

- Обзор каналов: [Каналы чатов](/ru/channels)
- Сопряжение: [Сопряжение](/ru/channels/pairing)
- Маршрутизация каналов: [Маршрутизация каналов](/ru/channels/channel-routing)
- Архитектура Plugin: [Архитектура Plugin](/ru/plugins/architecture)
- SDK для Plugin каналов: [SDK для Plugin каналов](/ru/plugins/sdk-channel-plugins)
- Внешний пакет: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
