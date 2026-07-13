---
read_when:
    - Первоначальная настройка с нуля
    - Вам нужен самый быстрый способ запустить рабочий чат
summary: Установите OpenClaw и запустите свой первый чат за считаные минуты.
title: Начало работы
x-i18n:
    generated_at: "2026-07-13T18:46:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 8f50073b059477636b94e128cec90b41dcc21c8bb132e34900e68409cacf70eb
    source_path: start/getting-started.md
    workflow: 16
---

Установите OpenClaw, пройдите первоначальную настройку и начните общаться со своим ИИ-ассистентом примерно за 5
минут. В результате у вас будут работающий Gateway, настроенная аутентификация и
активный сеанс чата.

## Что потребуется

- **Node.js 22.22.3+, 24.15+ или 25.9+** (24 — рекомендуемая версия по умолчанию)
- **Ключ API** поставщика модели (Anthropic, OpenAI, Google и т. д.) — мастер первоначальной настройки запросит его

<Tip>
Проверьте версию Node с помощью `node --version`.
**Пользователям Windows:** нативное приложение Windows Hub — самый простой вариант для настольной системы. Также
поддерживаются установщик PowerShell и запуск Gateway в WSL2. См. [Windows](/ru/platforms/windows).
Нужно установить Node? См. [Настройка Node](/ru/install/node).
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
  alt="Процесс выполнения установочного скрипта"
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
  <Step title="Запустите первоначальную настройку">
    ```bash
    openclaw onboard --install-daemon
    ```

    Мастер поможет выбрать поставщика модели, задать ключ API
    и настроить Gateway. QuickStart обычно занимает всего несколько минут, однако
    вход в систему поставщика, сопряжение канала, установка демона, загрузки из сети, навыки
    или дополнительные плагины могут увеличить продолжительность полной первоначальной настройки. Пропустите необязательные
    шаги и вернитесь к ним позже с помощью `openclaw configure`.

    Полное описание см. в разделе [Первоначальная настройка (CLI)](/ru/start/wizard).

  </Step>
  <Step title="Убедитесь, что Gateway работает">
    ```bash
    openclaw gateway status
    ```

    Должно появиться сообщение о том, что Gateway прослушивает порт 18789.

  </Step>
  <Step title="Откройте панель управления">
    ```bash
    openclaw dashboard
    ```

    Команда откроет Control UI в браузере. Если интерфейс загрузился, всё работает.

  </Step>
  <Step title="Отправьте первое сообщение">
    Введите сообщение в чате Control UI — вы должны получить ответ от ИИ.

    Хотите вместо этого общаться с телефона? Быстрее всего настроить канал
    [Telegram](/ru/channels/telegram) (потребуется только токен бота). Все варианты см. в разделе [Каналы](/ru/channels).

  </Step>
</Steps>

<Accordion title="Дополнительно: подключение пользовательской сборки Control UI">
  Если вы поддерживаете локализованную или изменённую сборку панели управления, укажите в
  `gateway.controlUi.root` каталог, содержащий собранные статические
  ресурсы и `index.html`.

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

## Дальнейшие действия

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
    Браузер, выполнение команд, веб-поиск, навыки и плагины.
  </Card>
</Columns>

<Accordion title="Дополнительно: переменные среды">
  Если вы запускаете OpenClaw от имени служебной учётной записи или хотите использовать пользовательские пути:

- `OPENCLAW_HOME` — домашний каталог для разрешения внутренних путей
- `OPENCLAW_STATE_DIR` — переопределяет каталог состояния
- `OPENCLAW_CONFIG_PATH` — переопределяет путь к файлу конфигурации

Полное описание: [Переменные среды](/ru/help/environment).
</Accordion>

## Связанные разделы

- [Обзор установки](/ru/install)
- [Обзор каналов](/ru/channels)
- [Настройка](/ru/start/setup)
