---
read_when:
    - Знайомство новачків з OpenClaw
summary: OpenClaw — це багатоканальний Gateway для ШІ-агентів, який працює в будь-якій операційній системі.
title: OpenClaw
x-i18n:
    generated_at: "2026-07-12T13:22:22Z"
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

> _«ВІДЛУЩУВАТИ! ВІДЛУЩУВАТИ!»_ — Мабуть, космічний омар

<p align="center">
  <strong>Gateway для будь-якої ОС, що забезпечує роботу ШІ-агентів у Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo тощо.</strong><br />
  Надішліть повідомлення й отримайте відповідь агента просто на телефоні. Запустіть один Gateway для плагінів каналів, WebChat і мобільних вузлів.
</p>

<Columns>
  <Card title="Початок роботи" href="/uk/start/getting-started" icon="rocket">
    Установіть OpenClaw і запустіть Gateway за лічені хвилини.
  </Card>
  <Card title="Запуск початкового налаштування" href="/uk/start/wizard" icon="list-checks">
    Покрокове налаштування за допомогою `openclaw onboard` і процедур сполучення.
  </Card>
  <Card title="Підключення каналу" href="/uk/channels" icon="message-circle">
    Підключіть Discord, Signal, Telegram, WhatsApp та інші сервіси, щоб спілкуватися звідусіль.
  </Card>
  <Card title="Відкриття інтерфейсу керування" href="/uk/web/control-ui" icon="layout-dashboard">
    Запустіть браузерну панель для чату, конфігурації та сеансів.
  </Card>
</Columns>

## Огляд документації

У мобільних браузерах меню розділів може відображатися без повної панелі вкладок для настільних пристроїв. Скористайтеся
цими посиланнями на основні розділи, щоб перейти з тексту сторінки до тих самих областей документації верхнього рівня.

<Columns>
  <Card title="Початок роботи" href="/uk" icon="rocket">
    Огляд, демонстрація, перші кроки та посібники з налаштування.
  </Card>
  <Card title="Установлення" href="/uk/install" icon="download">
    Способи встановлення, оновлення, контейнери, розміщення та розширене налаштування.
  </Card>
  <Card title="Канали" href="/uk/channels" icon="messages-square">
    Канали обміну повідомленнями, сполучення, маршрутизація, групи доступу та контроль якості каналів.
  </Card>
  <Card title="Агенти" href="/uk/concepts/architecture" icon="bot">
    Архітектура, сеанси, контекст, пам’ять і маршрутизація між кількома агентами.
  </Card>
  <Card title="Можливості" href="/uk/tools" icon="wand-sparkles">
    Інструменти, Skills, Cron, Webhook і можливості автоматизації.
  </Card>
  <Card title="ClawHub" href="/uk/clawhub" icon="store">
    Маркетплейс плагінів, публікація, добір і рекомендації щодо довіри.
  </Card>
  <Card title="Моделі" href="/uk/providers" icon="brain">
    Постачальники, конфігурація моделей, перемикання в разі відмови та локальні сервіси моделей.
  </Card>
  <Card title="Платформи" href="/uk/platforms" icon="monitor-smartphone">
    macOS, Windows, iOS, Android, вузли та вебінтерфейси.
  </Card>
  <Card title="Gateway і експлуатація" href="/uk/gateway" icon="server">
    Конфігурація Gateway, безпека, діагностика та експлуатація.
  </Card>
  <Card title="Довідник" href="/uk/cli" icon="terminal">
    Довідник CLI, схеми, RPC, примітки до випусків і шаблони.
  </Card>
  <Card title="Допомога" href="/uk/help" icon="life-buoy">
    Усунення несправностей, поширені запитання, тестування, діагностика та перевірка середовища.
  </Card>
</Columns>

## Що таке OpenClaw?

OpenClaw — це **самостійно розміщуваний Gateway**, який через плагіни каналів з’єднує ваші улюблені застосунки для спілкування — Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo тощо — із ШІ-агентами для програмування. Ви запускаєте один процес Gateway на власному комп’ютері (або сервері), і він стає мостом між вашими застосунками для обміну повідомленнями та завжди доступним ШІ-помічником.

**Для кого це?** Для розробників і досвідчених користувачів, яким потрібен особистий ШІ-помічник, якому можна писати звідусіль, не втрачаючи контролю над своїми даними й не покладаючись на розміщений сторонній сервіс.

**Що вирізняє OpenClaw?**

- **Самостійне розміщення**: працює на вашому обладнанні за вашими правилами
- **Багатоканальність**: один Gateway одночасно обслуговує всі налаштовані плагіни каналів
- **Орієнтація на агентів**: створено для агентів програмування з використанням інструментів, сеансами, пам’яттю та маршрутизацією між кількома агентами
- **Відкритий вихідний код**: ліцензія MIT і розвиток силами спільноти

**Що вам знадобиться?** Node 24 (рекомендовано) або Node 22 LTS (`22.19+`) для сумісності, ключ API вибраного постачальника та 5 хвилин. Для найкращої якості й безпеки використовуйте найпотужнішу доступну модель останнього покоління.

## Як це працює

```mermaid
flowchart LR
  A["Chat apps + plugins"] --> B["Gateway"]
  B --> C["OpenClaw agent"]
  B --> D["CLI"]
  B --> E["Web Control UI"]
  B --> F["macOS app"]
  B --> G["iOS and Android nodes"]
```

Gateway є єдиним джерелом істини для сеансів, маршрутизації та підключень каналів.

## Ключові можливості

<Columns>
  <Card title="Багатоканальний Gateway" icon="network" href="/uk/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat тощо в одному процесі Gateway.
  </Card>
  <Card title="Канали через плагіни" icon="plug" href="/uk/tools/plugin">
    Плагіни каналів додають Matrix, Nostr, Twitch, Zalo тощо; офіційні плагіни встановлюються за потреби.
  </Card>
  <Card title="Маршрутизація між кількома агентами" icon="route" href="/uk/concepts/multi-agent">
    Ізольовані сеанси для кожного агента, робочого простору або відправника.
  </Card>
  <Card title="Підтримка медіафайлів" icon="image" href="/uk/nodes/images">
    Надсилання й отримання зображень, аудіо та документів.
  </Card>
  <Card title="Вебінтерфейс керування" icon="monitor" href="/uk/web/control-ui">
    Браузерна панель для чату, конфігурації, сеансів і вузлів.
  </Card>
  <Card title="Мобільні вузли" icon="smartphone" href="/uk/nodes">
    Сполучайте вузли iOS і Android для робочих процесів із Canvas, камерою та голосовими функціями.
  </Card>
</Columns>

## Швидкий початок

<Steps>
  <Step title="Установіть OpenClaw">
    ```bash
    npm install -g openclaw@latest
    ```
  </Step>
  <Step title="Виконайте початкове налаштування та встановіть службу">
    ```bash
    openclaw onboard --install-daemon
    ```
  </Step>
  <Step title="Почніть спілкування">
    Відкрийте інтерфейс керування у браузері та надішліть повідомлення:

    ```bash
    openclaw dashboard
    ```

    Або підключіть канал ([Telegram](/uk/channels/telegram) — найшвидший варіант) і спілкуйтеся з телефона.

  </Step>
</Steps>

Потрібні повні інструкції зі встановлення та налаштування середовища розробки? Дивіться [Початок роботи](/uk/start/getting-started).

## Панель керування

Після запуску Gateway відкрийте браузерний інтерфейс керування.

- Локальна адреса за замовчуванням: [http://127.0.0.1:18789/](http://127.0.0.1:18789/)
- Віддалений доступ: [Вебінтерфейси](/uk/web) і [Tailscale](/uk/gateway/tailscale)

<p align="center">
  <img src="/whatsapp-openclaw.jpg" alt="OpenClaw" width="420" />
</p>

## Конфігурація (необов’язково)

Конфігурація зберігається у `~/.openclaw/openclaw.json`.

- Якщо ви **нічого не робитимете**, OpenClaw використовуватиме вбудоване середовище виконання агента OpenClaw; особисті повідомлення використовуватимуть основний сеанс агента, а кожен груповий чат матиме власний сеанс.
- Щоб обмежити доступ, почніть із `channels.whatsapp.allowFrom` і правил згадування для груп.

Приклад:

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

## З чого почати

<Columns>
  <Card title="Основні розділи документації" href="/uk/start/hubs" icon="book-open">
    Уся документація та посібники, упорядковані за сценаріями використання.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="settings">
    Основні налаштування Gateway, токени та конфігурація постачальників.
  </Card>
  <Card title="Віддалений доступ" href="/uk/gateway/remote" icon="globe">
    Схеми доступу через SSH і tailnet.
  </Card>
  <Card title="Канали" href="/uk/channels/telegram" icon="message-square">
    Налаштування окремих каналів для Discord, Feishu, Microsoft Teams, Telegram, WhatsApp тощо.
  </Card>
  <Card title="Вузли" href="/uk/nodes" icon="smartphone">
    Вузли iOS і Android зі сполученням, Canvas, камерою та діями пристрою.
  </Card>
  <Card title="Допомога" href="/uk/help" icon="life-buoy">
    Поширені способи виправлення проблем і початкова сторінка усунення несправностей.
  </Card>
</Columns>

## Докладніше

<Columns>
  <Card title="Повний перелік функцій" href="/uk/concepts/features" icon="list">
    Повний перелік можливостей каналів, маршрутизації та роботи з медіафайлами.
  </Card>
  <Card title="Маршрутизація між кількома агентами" href="/uk/concepts/multi-agent" icon="route">
    Ізоляція робочих просторів і окремі сеанси для кожного агента.
  </Card>
  <Card title="Безпека" href="/uk/gateway/security" icon="shield">
    Токени, списки дозволів і засоби контролю безпеки.
  </Card>
  <Card title="Усунення несправностей" href="/uk/gateway/troubleshooting" icon="wrench">
    Діагностика Gateway і поширені помилки.
  </Card>
  <Card title="Про проєкт і подяки" href="/uk/reference/credits" icon="info">
    Походження проєкту, учасники та ліцензія.
  </Card>
</Columns>
