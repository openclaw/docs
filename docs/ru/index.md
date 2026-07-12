---
read_when:
    - Знакомство новичков с OpenClaw
summary: OpenClaw — это многоканальный Gateway для ИИ-агентов, работающий в любой ОС.
title: OpenClaw
x-i18n:
    generated_at: "2026-07-12T11:29:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2b87c2a9ce06f110bda45709fb6055ed8000f73993793ea7386db2a47a782828
    source_path: index.md
    workflow: 16
---

# OpenClaw 🦞

<p align="center">
    <img
        src="/assets/openclaw-hero-light.png"
        alt="OpenClaw"
        width="500"
        class="dark:hidden"
    />
    <img
        src="/assets/openclaw-hero-dark.png"
        alt="OpenClaw"
        width="500"
        class="hidden dark:block"
    />
</p>

> _«ОТШЕЛУШИТЬ! ОТШЕЛУШИТЬ!»_ — вероятно, космический лобстер

<p align="center">
  <strong>Gateway для любой ОС, объединяющий ИИ-агентов с Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo и другими сервисами.</strong><br />
  Отправьте сообщение и получите ответ агента прямо на телефон. Используйте единый Gateway для Plugin каналов, WebChat и мобильных узлов.
</p>

<Columns>
  <Card title="Начало работы" href="/ru/start/getting-started" icon="rocket">
    Установите OpenClaw и запустите Gateway за несколько минут.
  </Card>
  <Card title="Первоначальная настройка" href="/ru/start/wizard" icon="list-checks">
    Пошаговая настройка с помощью `openclaw onboard` и процедур сопряжения.
  </Card>
  <Card title="Подключение канала" href="/ru/channels" icon="message-circle">
    Подключите Discord, Signal, Telegram, WhatsApp и другие сервисы, чтобы общаться откуда угодно.
  </Card>
  <Card title="Открытие интерфейса управления" href="/ru/web/control-ui" icon="layout-dashboard">
    Запустите браузерную панель для чата, конфигурации и сеансов.
  </Card>
</Columns>

## Обзор документации

В мобильных браузерах меню разделов может отображаться без полной панели вкладок настольной версии. Используйте
эти ссылки на центральные страницы, чтобы перейти из содержимого страницы к тем же разделам документации верхнего уровня.

<Columns>
  <Card title="Начало работы" href="/ru" icon="rocket">
    Обзор, демонстрация возможностей, первые шаги и руководства по настройке.
  </Card>
  <Card title="Установка" href="/ru/install" icon="download">
    Способы установки, обновления, контейнеры, хостинг и расширенная настройка.
  </Card>
  <Card title="Каналы" href="/ru/channels" icon="messages-square">
    Каналы обмена сообщениями, сопряжение, маршрутизация, группы доступа и контроль качества каналов.
  </Card>
  <Card title="Агенты" href="/ru/concepts/architecture" icon="bot">
    Архитектура, сеансы, контекст, память и маршрутизация между несколькими агентами.
  </Card>
  <Card title="Возможности" href="/ru/tools" icon="wand-sparkles">
    Инструменты, Skills, Cron, Webhook и возможности автоматизации.
  </Card>
  <Card title="ClawHub" href="/ru/clawhub" icon="store">
    Каталог Plugin, публикация, отбор и рекомендации по доверию.
  </Card>
  <Card title="Модели" href="/ru/providers" icon="brain">
    Поставщики, настройка моделей, аварийное переключение и локальные сервисы моделей.
  </Card>
  <Card title="Платформы" href="/ru/platforms" icon="monitor-smartphone">
    macOS, Windows, iOS, Android, узлы и веб-интерфейсы.
  </Card>
  <Card title="Gateway и эксплуатация" href="/ru/gateway" icon="server">
    Настройка, безопасность, диагностика и эксплуатация Gateway.
  </Card>
  <Card title="Справочник" href="/ru/cli" icon="terminal">
    Справочник CLI, схемы, RPC, примечания к выпускам и шаблоны.
  </Card>
  <Card title="Помощь" href="/ru/help" icon="life-buoy">
    Устранение неполадок, часто задаваемые вопросы, тестирование, диагностика и проверка среды.
  </Card>
</Columns>

## Что такое OpenClaw?

OpenClaw — это **самостоятельно размещаемый Gateway**, который через Plugin каналов подключает ваши любимые приложения для общения — Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo и другие — к ИИ-агентам для программирования. Вы запускаете единый процесс Gateway на своем компьютере или сервере, и он становится связующим звеном между приложениями для обмена сообщениями и всегда доступным ИИ-помощником.

**Для кого он предназначен?** Для разработчиков и опытных пользователей, которым нужен персональный ИИ-помощник, доступный через сообщения из любого места, но без потери контроля над своими данными и зависимости от облачного сервиса.

**Чем он отличается?**

- **Самостоятельное размещение**: работает на вашем оборудовании и по вашим правилам
- **Многоканальность**: один Gateway одновременно обслуживает все настроенные Plugin каналов
- **Ориентация на агентов**: создан для агентов программирования с поддержкой инструментов, сеансов, памяти и маршрутизации между несколькими агентами
- **Открытый исходный код**: лицензия MIT, развитие силами сообщества

**Что потребуется?** Node 24 (рекомендуется) либо Node 22 LTS (`22.19+`) для совместимости, ключ API выбранного поставщика и пять минут. Для максимального качества и безопасности используйте самую мощную доступную модель последнего поколения.

## Принцип работы

```mermaid
flowchart LR
  A["Приложения для общения + плагины"] --> B["Gateway"]
  B --> C["Агент OpenClaw"]
  B --> D["CLI"]
  B --> E["Веб-интерфейс управления"]
  B --> F["Приложение macOS"]
  B --> G["Узлы iOS и Android"]
```

Gateway служит единым источником истины для сеансов, маршрутизации и подключений каналов.

## Основные возможности

<Columns>
  <Card title="Многоканальный Gateway" icon="network" href="/ru/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat и другие сервисы через единый процесс Gateway.
  </Card>
  <Card title="Plugin каналов" icon="plug" href="/ru/tools/plugin">
    Plugin каналов добавляют Matrix, Nostr, Twitch, Zalo и другие сервисы; официальные Plugin устанавливаются по запросу.
  </Card>
  <Card title="Маршрутизация между несколькими агентами" icon="route" href="/ru/concepts/multi-agent">
    Изолированные сеансы для каждого агента, рабочего пространства или отправителя.
  </Card>
  <Card title="Поддержка мультимедиа" icon="image" href="/ru/nodes/images">
    Отправка и получение изображений, аудиозаписей и документов.
  </Card>
  <Card title="Веб-интерфейс управления" icon="monitor" href="/ru/web/control-ui">
    Браузерная панель для чата, конфигурации, сеансов и узлов.
  </Card>
  <Card title="Мобильные узлы" icon="smartphone" href="/ru/nodes">
    Подключайте узлы iOS и Android для рабочих процессов с Canvas, камерой и голосовым управлением.
  </Card>
</Columns>

## Быстрый старт

<Steps>
  <Step title="Установка OpenClaw">
    ```bash
    npm install -g openclaw@latest
    ```
  </Step>
  <Step title="Первоначальная настройка и установка службы">
    ```bash
    openclaw onboard --install-daemon
    ```
  </Step>
  <Step title="Общение">
    Откройте интерфейс управления в браузере и отправьте сообщение:

    ```bash
    openclaw dashboard
    ```

    Либо подключите канал ([Telegram](/ru/channels/telegram) настраивается быстрее всего) и общайтесь с телефона.

  </Step>
</Steps>

Нужны полные инструкции по установке и настройке среды разработки? См. раздел [«Начало работы»](/ru/start/getting-started).

## Панель управления

После запуска Gateway откройте браузерный интерфейс управления.

- Локальный адрес по умолчанию: [http://127.0.0.1:18789/](http://127.0.0.1:18789/)
- Удаленный доступ: [веб-интерфейсы](/ru/web) и [Tailscale](/ru/gateway/tailscale)

<p align="center">
  <img src="/whatsapp-openclaw.jpg" alt="OpenClaw" width="420" />
</p>

## Конфигурация (необязательно)

Конфигурация хранится в `~/.openclaw/openclaw.json`.

- Если **ничего не настраивать**, OpenClaw использует встроенную среду выполнения агента OpenClaw; личные сообщения используют основной сеанс агента, а для каждого группового чата создается отдельный сеанс.
- Чтобы ограничить доступ, начните с `channels.whatsapp.allowFrom` и правил упоминания для групп.

Пример:

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  messages: { groupChat: { mentionPatterns: ["@openclaw"] } },
}
```

## С чего начать

<Columns>
  <Card title="Центральные страницы документации" href="/ru/start/hubs" icon="book-open">
    Вся документация и руководства, сгруппированные по сценариям использования.
  </Card>
  <Card title="Конфигурация" href="/ru/gateway/configuration" icon="settings">
    Основные параметры Gateway, токены и конфигурация поставщиков.
  </Card>
  <Card title="Удаленный доступ" href="/ru/gateway/remote" icon="globe">
    Схемы доступа через SSH и tailnet.
  </Card>
  <Card title="Каналы" href="/ru/channels/telegram" icon="message-square">
    Настройка отдельных каналов для Discord, Feishu, Microsoft Teams, Telegram, WhatsApp и других сервисов.
  </Card>
  <Card title="Узлы" href="/ru/nodes" icon="smartphone">
    Узлы iOS и Android с сопряжением, Canvas, камерой и действиями на устройстве.
  </Card>
  <Card title="Помощь" href="/ru/help" icon="life-buoy">
    Распространенные решения и отправная точка для устранения неполадок.
  </Card>
</Columns>

## Подробнее

<Columns>
  <Card title="Полный список возможностей" href="/ru/concepts/features" icon="list">
    Все возможности каналов, маршрутизации и работы с мультимедиа.
  </Card>
  <Card title="Маршрутизация между несколькими агентами" href="/ru/concepts/multi-agent" icon="route">
    Изоляция рабочих пространств и отдельные сеансы для каждого агента.
  </Card>
  <Card title="Безопасность" href="/ru/gateway/security" icon="shield">
    Токены, списки разрешений и средства контроля безопасности.
  </Card>
  <Card title="Устранение неполадок" href="/ru/gateway/troubleshooting" icon="wrench">
    Диагностика Gateway и распространенные ошибки.
  </Card>
  <Card title="О проекте и участниках" href="/ru/reference/credits" icon="info">
    История проекта, участники и лицензия.
  </Card>
</Columns>
