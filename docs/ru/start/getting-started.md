---
read_when:
    - Первичная настройка с нуля
    - Вам нужен самый быстрый путь к рабочему чату
summary: Установите OpenClaw и запустите первый чат за считанные минуты.
title: Начало работы
x-i18n:
    generated_at: "2026-06-28T23:47:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 579ed2b4797dc851b0293b96a4177cc356641b6842fe45c4d48f4e8c224eef75
    source_path: start/getting-started.md
    workflow: 16
---

Установите OpenClaw, пройдите онбординг и общайтесь со своим ИИ-ассистентом — все это
примерно за 5 минут. В итоге у вас будет запущенный Gateway, настроенная аутентификация
и рабочий сеанс чата.

## Что вам понадобится

- **Node.js** — рекомендуется Node 24 (Node 22.19+ также поддерживается)
- **API-ключ** от поставщика моделей (Anthropic, OpenAI, Google и т. д.) — онбординг запросит его

<Tip>
Проверьте версию Node с помощью `node --version`.
**Пользователям Windows:** нативное Windows-приложение Hub — самый простой путь для рабочего стола. Установщик
PowerShell и пути Gateway через WSL2 также поддерживаются. См. [Windows](/ru/platforms/windows).
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
  alt="Процесс установочного скрипта"
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
  <Step title="Запустите онбординг">
    ```bash
    openclaw onboard --install-daemon
    ```

    Мастер проведет вас через выбор поставщика моделей, настройку API-ключа
    и конфигурацию Gateway. QuickStart обычно занимает всего несколько минут, но
    вход у поставщика, сопряжение канала, установка демона, сетевые загрузки, Skills
    или дополнительные плагины могут увеличить время полного онбординга. Необязательные
    шаги можно пропустить и вернуться к ним позже с помощью `openclaw configure`.

    Полный справочник см. в [Онбординг (CLI)](/ru/start/wizard).

  </Step>
  <Step title="Проверьте, что Gateway запущен">
    ```bash
    openclaw gateway status
    ```

    Вы должны увидеть, что Gateway слушает порт 18789.

  </Step>
  <Step title="Откройте панель управления">
    ```bash
    openclaw dashboard
    ```

    Это откроет Control UI в вашем браузере. Если он загрузился, все работает.

  </Step>
  <Step title="Отправьте первое сообщение">
    Введите сообщение в чате Control UI, и вы должны получить ответ ИИ.

    Хотите вместо этого общаться с телефона? Самый быстрый канал для настройки —
    [Telegram](/ru/channels/telegram) (нужен только токен бота). Все варианты см. в [Каналы](/ru/channels).

  </Step>
</Steps>

<Accordion title="Дополнительно: подключение собственной сборки Control UI">
  Если вы поддерживаете локализованную или настроенную сборку панели управления, укажите
  в `gateway.controlUi.root` каталог, содержащий собранные статические
  ресурсы и `index.html`.

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Copy your built static files into that directory.
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
  <Card title="Просмотреть инструменты" href="/ru/tools" icon="wrench">
    Браузер, exec, веб-поиск, Skills и плагины.
  </Card>
</Columns>

<Accordion title="Дополнительно: переменные окружения">
  Если вы запускаете OpenClaw от имени сервисной учетной записи или хотите использовать собственные пути:

- `OPENCLAW_HOME` — домашний каталог для разрешения внутренних путей
- `OPENCLAW_STATE_DIR` — переопределяет каталог состояния
- `OPENCLAW_CONFIG_PATH` — переопределяет путь к файлу конфигурации

Полный справочник: [Переменные окружения](/ru/help/environment).
</Accordion>

## Связанные материалы

- [Обзор установки](/ru/install)
- [Обзор каналов](/ru/channels)
- [Настройка](/ru/start/setup)
