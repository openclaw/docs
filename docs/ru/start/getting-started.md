---
read_when:
    - Первоначальная настройка с нуля
    - Вам нужен самый быстрый способ запустить рабочий чат
summary: Установите OpenClaw и запустите свой первый чат за считаные минуты.
title: Начало работы
x-i18n:
    generated_at: "2026-07-12T11:51:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 308ca58b8a11832b5a4c0d4634d1c88ef44681ef755a18d675bcff60b5aba929
    source_path: start/getting-started.md
    workflow: 16
---

Установите OpenClaw, выполните первоначальную настройку и начните общаться со своим ИИ-помощником примерно за 5
минут. В результате у вас будут запущенный Gateway, настроенная аутентификация и
рабочий сеанс чата.

## Что вам понадобится

- **Node.js 22.19+, 23.11+ или 24+** (версия 24 рекомендуется по умолчанию)
- **Ключ API** поставщика модели (Anthropic, OpenAI, Google и т. д.) — мастер настройки предложит его указать

<Tip>
Проверьте версию Node с помощью `node --version`.
**Пользователям Windows:** нативное приложение Windows Hub — самый простой вариант для настольной системы. Также
поддерживаются установщик PowerShell и запуск Gateway в WSL2. См. раздел [Windows](/ru/platforms/windows).
Нужно установить Node? См. раздел [Настройка Node](/ru/install/node).
</Tip>

## Быстрая настройка

<Steps>
  <Step title="Установите OpenClaw">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="Процесс выполнения скрипта установки"
  className="rounded-lg"
/>
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        iwr -useb https://openclaw.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    <Note>
    Другие способы установки (Docker, Nix, npm): [Установка](/ru/install).
    </Note>

  </Step>
  <Step title="Выполните первоначальную настройку">
    ```bash
    openclaw onboard --install-daemon
    ```

    Мастер поможет выбрать поставщика модели, задать ключ API и
    настроить Gateway. Быстрый запуск обычно занимает всего несколько минут, однако
    вход в систему поставщика, сопряжение канала, установка фоновой службы, загрузки из сети, Skills
    или дополнительные плагины могут увеличить продолжительность полной первоначальной настройки. Пропустите необязательные
    шаги и вернитесь к ним позже с помощью `openclaw configure`.

    Полное справочное руководство см. в разделе [Первоначальная настройка (CLI)](/ru/start/wizard).

  </Step>
  <Step title="Убедитесь, что Gateway запущен">
    ```bash
    openclaw gateway status
    ```

    Вы должны увидеть, что Gateway прослушивает порт 18789.

  </Step>
  <Step title="Откройте панель управления">
    ```bash
    openclaw dashboard
    ```

    Эта команда откроет интерфейс управления в браузере. Если он загрузился, всё работает.

  </Step>
  <Step title="Отправьте первое сообщение">
    Введите сообщение в чате интерфейса управления — вы должны получить ответ от ИИ.

    Хотите общаться с телефона? Быстрее всего настроить канал
    [Telegram](/ru/channels/telegram) (понадобится только токен бота). Все варианты см. в разделе [Каналы](/ru/channels).

  </Step>
</Steps>

<Accordion title="Для опытных пользователей: подключение собственной сборки интерфейса управления">
  Если вы поддерживаете локализованную или изменённую сборку панели управления, укажите
  в `gateway.controlUi.root` каталог, содержащий собранные статические
  ресурсы и файл `index.html`.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Скопируйте собранные статические файлы в этот каталог.
```

Затем задайте:

```json
{
  "gateway": {
    "controlUi": {
      "enabled": true,
      "root": "$HOME/.openclaw/control-ui-custom"
    }
  }
}
```

Перезапустите Gateway и снова откройте панель управления:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## Что делать дальше

<Columns>
  <Card title="Подключить канал" href="/ru/channels" icon="message-square">
    Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo и другие.
  </Card>
  <Card title="Сопряжение и безопасность" href="/ru/channels/pairing" icon="shield">
    Управляйте тем, кто может отправлять сообщения вашему агенту.
  </Card>
  <Card title="Настроить Gateway" href="/ru/gateway/configuration" icon="settings">
    Модели, инструменты, песочница и расширенные настройки.
  </Card>
  <Card title="Обзор инструментов" href="/ru/tools" icon="wrench">
    Браузер, выполнение команд, веб-поиск, Skills и плагины.
  </Card>
</Columns>

<Accordion title="Для опытных пользователей: переменные окружения">
  Если вы запускаете OpenClaw от имени служебной учётной записи или хотите задать собственные пути:

- `OPENCLAW_HOME` — домашний каталог для разрешения внутренних путей
- `OPENCLAW_STATE_DIR` — переопределение каталога состояния
- `OPENCLAW_CONFIG_PATH` — переопределение пути к файлу конфигурации

Полное справочное руководство: [Переменные окружения](/ru/help/environment).
</Accordion>

## Связанные разделы

- [Обзор установки](/ru/install)
- [Обзор каналов](/ru/channels)
- [Настройка](/ru/start/setup)
