---
read_when:
    - Новая установка, зависшее первичное подключение или ошибки первого запуска
    - Выбор аутентификации и подписок провайдера
    - Нет доступа к docs.openclaw.ai, не открывается панель управления, установка зависла
sidebarTitle: First-run FAQ
summary: 'FAQ: быстрый старт и первичная настройка — установка, onboarding, аутентификация, подписки, первые сбои'
title: 'FAQ: настройка при первом запуске'
x-i18n:
    generated_at: "2026-06-28T23:02:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ef4122bc0c3068806591ccdc1bf7f3eb5a81cc7efd2066d07f948fe953284be
    source_path: help/faq-first-run.md
    workflow: 16
---

  Q&A для быстрого старта и первого запуска. Для повседневных операций, моделей, авторизации, сессий
  и устранения неполадок см. основной [FAQ](/ru/help/faq).

  ## Быстрый старт и настройка первого запуска

  <AccordionGroup>
  <Accordion title="Я застрял, самый быстрый способ продолжить">
    Используйте локального AI-агента, который может **видеть вашу машину**. Это намного эффективнее, чем спрашивать
    в Discord, потому что большинство случаев "я застрял" — это **проблемы локальной конфигурации или окружения**,
    которые удаленные помощники не могут проверить.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Эти инструменты могут читать репозиторий, запускать команды, просматривать логи и помогать исправлять настройку
    на уровне машины (PATH, службы, разрешения, файлы авторизации). Дайте им **полный checkout исходного кода** через
    hackable (git) установку:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Это устанавливает OpenClaw **из git checkout**, поэтому агент может читать код + документацию и
    рассуждать о точной версии, которую вы запускаете. Позже вы всегда можете вернуться на stable,
    повторно запустив установщик без `--install-method git`.

    Совет: попросите агента **спланировать и проконтролировать** исправление (пошагово), а затем выполнить только
    необходимые команды. Так изменения будут небольшими и их проще будет проверить.

    Если вы обнаружите реальную ошибку или исправление, пожалуйста, создайте issue на GitHub или отправьте PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Начните с этих команд (делитесь выводом, когда просите о помощи):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Что они делают:

    - `openclaw status`: быстрый снимок состояния gateway/agent + базовой конфигурации.
    - `openclaw models status`: проверяет авторизацию провайдера + доступность моделей.
    - `openclaw doctor`: проверяет и исправляет распространенные проблемы конфигурации/состояния.

    Другие полезные проверки CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Быстрый цикл отладки: [Первые 60 секунд, если что-то сломалось](/ru/help/faq#first-60-seconds-if-something-is-broken).
    Документация по установке: [Установка](/ru/install), [Флаги установщика](/ru/install/installer), [Обновление](/ru/install/updating).

  </Accordion>

  <Accordion title="Heartbeat постоянно пропускается. Что означают причины пропуска?">
    Распространенные причины пропуска Heartbeat:

    - `quiet-hours`: вне настроенного окна активных часов
    - `empty-heartbeat-file`: `HEARTBEAT.md` существует, но содержит только пустые строки, комментарии, заголовок, fence или заготовку пустого чеклиста
    - `no-tasks-due`: режим задач `HEARTBEAT.md` активен, но сроки ни одного из интервалов задач еще не наступили
    - `alerts-disabled`: вся видимость Heartbeat отключена (`showOk`, `showAlerts` и `useIndicator` выключены)

    В режиме задач метки времени наступивших сроков сдвигаются только после завершения
    настоящего запуска Heartbeat. Пропущенные запуски не отмечают задачи как выполненные.

    Документация: [Heartbeat](/ru/gateway/heartbeat), [Автоматизация](/ru/automation).

  </Accordion>

  <Accordion title="Рекомендуемый способ установить и настроить OpenClaw">
    Репозиторий рекомендует запуск из исходного кода и использование onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Мастер также может автоматически собрать UI-ресурсы. После onboarding вы обычно запускаете Gateway на порту **18789**.

    Из исходного кода (для контрибьюторов/разработки):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Если у вас еще нет глобальной установки, запустите через `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Как открыть dashboard после onboarding?">
    Мастер открывает браузер с чистым (без токена в URL) адресом dashboard сразу после onboarding, а также печатает ссылку в сводке. Оставьте эту вкладку открытой; если она не запустилась, скопируйте/вставьте напечатанный URL на той же машине.
  </Accordion>

  <Accordion title="Как авторизовать dashboard на localhost и удаленно?">
    **Localhost (та же машина):**

    - Откройте `http://127.0.0.1:18789/`.
    - Если он запрашивает авторизацию через shared secret, вставьте настроенный токен или пароль в настройки Control UI.
    - Источник токена: `gateway.auth.token` (или `OPENCLAW_GATEWAY_TOKEN`).
    - Источник пароля: `gateway.auth.password` (или `OPENCLAW_GATEWAY_PASSWORD`).
    - Если shared secret еще не настроен, сгенерируйте токен с помощью `openclaw doctor --generate-gateway-token`.

    **Не на localhost:**

    - **Tailscale Serve** (рекомендуется): оставьте bind на loopback, запустите `openclaw gateway --tailscale serve`, откройте `https://<magicdns>/`. Если `gateway.auth.allowTailscale` равно `true`, заголовки идентичности удовлетворяют авторизацию Control UI/WebSocket (без вставки shared secret, предполагается доверенный gateway host); HTTP API по-прежнему требуют авторизацию shared secret, если вы намеренно не используете private-ingress `none` или HTTP-авторизацию через trusted-proxy.
      Неудачные параллельные попытки авторизации Serve от одного клиента сериализуются до того, как ограничитель failed-auth их запишет, поэтому вторая неудачная повторная попытка уже может показать `retry later`.
    - **Tailnet bind**: запустите `openclaw gateway --bind tailnet --token "<token>"` (или настройте авторизацию паролем), откройте `http://<tailscale-ip>:18789/`, затем вставьте соответствующий shared secret в настройках dashboard.
    - **Identity-aware reverse proxy**: держите Gateway за доверенным proxy, настройте `gateway.auth.mode: "trusted-proxy"`, затем откройте URL proxy. Loopback proxy на том же хосте требуют явного `gateway.auth.trustedProxy.allowLoopback = true`.
    - **SSH-туннель**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, затем откройте `http://127.0.0.1:18789/`. Авторизация shared secret все равно применяется через туннель; вставьте настроенный токен или пароль, если появится запрос.

    См. [Dashboard](/ru/web/dashboard) и [Веб-поверхности](/ru/web) для режимов bind и деталей авторизации.

  </Accordion>

  <Accordion title="Почему для chat approvals есть две конфигурации exec approval?">
    Они управляют разными слоями:

    - `approvals.exec`: пересылает запросы approval в чаты назначения
    - `channels.<channel>.execApprovals`: заставляет этот канал выступать как native approval client для exec approvals

    Политика exec на хосте все равно остается настоящим шлюзом approval. Конфигурация чата управляет только тем, где
    появляются запросы approval и как люди могут на них отвечать.

    В большинстве настроек вам **не** нужны обе:

    - Если чат уже поддерживает команды и ответы, same-chat `/approve` работает через общий путь.
    - Если поддерживаемый native-канал может безопасно определить approvers, OpenClaw теперь автоматически включает DM-first native approvals, когда `channels.<channel>.execApprovals.enabled` не задан или равен `"auto"`.
    - Когда доступны native approval cards/buttons, этот native UI является основным путем; агент должен включать ручную команду `/approve` только если результат инструмента говорит, что chat approvals недоступны или ручной approval — единственный путь.
    - Используйте `approvals.exec` только когда запросы также нужно пересылать в другие чаты или явные ops-комнаты.
    - Используйте `channels.<channel>.execApprovals.target: "channel"` или `"both"` только когда вы явно хотите публиковать запросы approval обратно в исходную комнату/тему.
    - Plugin approvals снова отдельны: они по умолчанию используют same-chat `/approve`, опциональную пересылку `approvals.plugin`, и только некоторые native-каналы сохраняют plugin-approval-native обработку поверх этого.

    Кратко: forwarding нужен для маршрутизации, конфигурация native client — для более богатого UX, специфичного для канала.
    См. [Exec Approvals](/ru/tools/exec-approvals).

  </Accordion>

  <Accordion title="Какой runtime мне нужен?">
    Требуется Node **>= 22**. Рекомендуется `pnpm`. Bun **не рекомендуется** для Gateway.
  </Accordion>

  <Accordion title="Работает ли это на Raspberry Pi?">
    Да. Gateway легковесный — документация указывает, что **512MB-1GB RAM**, **1 core** и около **500MB**
    диска достаточно для личного использования, и отмечает, что **Raspberry Pi 4 может это запускать**.

    Если нужен дополнительный запас (логи, медиа, другие службы), **рекомендуется 2GB**, но это
    не жесткий минимум.

    Совет: небольшой Raspberry Pi/VPS может хостить Gateway, а вы можете подключать **nodes** на ноутбуке/телефоне для
    локального экрана/камеры/canvas или выполнения команд. См. [Nodes](/ru/nodes).

  </Accordion>

  <Accordion title="Есть советы для установки на Raspberry Pi?">
    Кратко: это работает, но ожидайте шероховатости.

    - Используйте **64-bit** ОС и держите Node >= 22.
    - Предпочитайте **hackable (git) установку**, чтобы видеть логи и быстро обновляться.
    - Начните без channels/skills, затем добавляйте их по одному.
    - Если столкнетесь со странными проблемами бинарников, обычно это проблема **ARM compatibility**.

    Документация: [Linux](/ru/platforms/linux), [Установка](/ru/install).

  </Accordion>

  <Accordion title="Зависло на wake up my friend / onboarding не вылупляется. Что теперь?">
    Этот экран зависит от доступности и авторизации Gateway. TUI также автоматически отправляет
    "Wake up, my friend!" при первом hatch. Если вы видите эту строку **без ответа**,
    а tokens остаются на 0, агент не запускался.

    1. Перезапустите Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Проверьте статус + авторизацию:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Если все еще зависает, запустите:

    ```bash
    openclaw doctor
    ```

    Если Gateway удаленный, убедитесь, что туннель/Tailscale-соединение активно и что UI
    указывает на правильный Gateway. См. [Удаленный доступ](/ru/gateway/remote).

  </Accordion>

  <Accordion title="Можно ли перенести мою настройку на новую машину (Mac mini), не проходя onboarding заново?">
    Да. Скопируйте **каталог состояния** и **workspace**, затем один раз запустите Doctor. Это
    сохранит вашего бота "точно таким же" (память, история сессий, авторизация и состояние каналов),
    если вы скопируете **оба** расположения:

    1. Установите OpenClaw на новую машину.
    2. Скопируйте `$OPENCLAW_STATE_DIR` (по умолчанию: `~/.openclaw`) со старой машины.
    3. Скопируйте ваш workspace (по умолчанию: `~/.openclaw/workspace`).
    4. Запустите `openclaw doctor` и перезапустите службу Gateway.

    Это сохраняет конфигурацию, профили авторизации, WhatsApp creds, сессии и память. Если вы в
    remote mode, помните, что gateway host владеет хранилищем сессий и workspace.

    **Важно:** если вы только commit/push ваш workspace на GitHub, вы делаете резервную копию
    **памяти + bootstrap-файлов**, но **не** истории сессий или авторизации. Они находятся
    в `~/.openclaw/` (например `~/.openclaw/agents/<agentId>/sessions/`).

    См. также: [Миграция](/ru/install/migrating), [Где данные находятся на диске](/ru/help/faq#where-things-live-on-disk),
    [Workspace агента](/ru/concepts/agent-workspace), [Doctor](/ru/gateway/doctor),
    [Remote mode](/ru/gateway/remote).

  </Accordion>

  <Accordion title="Где посмотреть, что нового в последней версии?">
    Проверьте changelog на GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Новейшие записи находятся сверху. Если верхний раздел помечен как **Unreleased**, следующий раздел
    с датой — это последняя выпущенная версия. Записи сгруппированы по **Highlights**, **Changes** и
    **Fixes** (плюс разделы docs/other при необходимости).

  </Accordion>

  <Accordion title="Не удается получить доступ к docs.openclaw.ai (SSL-ошибка)">
    Некоторые подключения Comcast/Xfinity ошибочно блокируют `docs.openclaw.ai` через Xfinity
    Advanced Security. Отключите это или добавьте `docs.openclaw.ai` в allowlist, затем повторите попытку.
    Пожалуйста, помогите нам разблокировать это, отправив отчет здесь: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Если сайт по-прежнему недоступен, документация зеркалируется на GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Разница между stable и beta">
    **Stable** и **beta** — это **npm dist-tags**, а не отдельные ветки кода:

    - `latest` = stable
    - `beta` = ранняя сборка для тестирования

    Обычно стабильный релиз сначала попадает в **beta**, затем отдельный
    шаг продвижения переносит ту же версию в `latest`. Мейнтейнеры также могут
    публиковать сразу в `latest`, когда это нужно. Поэтому beta и stable могут
    указывать на **одну и ту же версию** после продвижения.

    Посмотрите, что изменилось:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Однострочные команды установки и разницу между beta и dev смотрите в аккордеоне ниже.

  </Accordion>

  <Accordion title="Как установить beta-версию и чем beta отличается от dev?">
    **Beta** — это npm dist-tag `beta` (после продвижения может совпадать с `latest`).
    **Dev** — это подвижная вершина `main` (git); при публикации она использует npm dist-tag `dev`.

    Однострочные команды (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Установщик для Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Подробнее: [Каналы разработки](/ru/install/development-channels) и [Флаги установщика](/ru/install/installer).

  </Accordion>

  <Accordion title="Как попробовать самые свежие сборки?">
    Два варианта:

    1. **Канал dev (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Это переключает на ветку `main` и обновляет из исходного кода.

    2. **Установка, доступная для изменения (с сайта установщика):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Вы получите локальный репозиторий, который можно редактировать, а затем обновлять через git.

    Если вы предпочитаете вручную сделать чистый clone, используйте:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Документация: [Обновление](/ru/cli/update), [Каналы разработки](/ru/install/development-channels),
    [Установка](/ru/install).

  </Accordion>

  <Accordion title="Сколько обычно занимает установка и первичная настройка?">
    Примерный ориентир:

    - **Установка:** 2-5 минут
    - **Первичная настройка QuickStart:** обычно несколько минут
    - **Полная первичная настройка:** дольше, если вход в провайдера, сопряжение канала, установка daemon,
      сетевые загрузки, Skills или дополнительные plugins требуют дополнительной настройки

    Мастер CLI заранее показывает эту временную шкалу. Дополнительные шаги можно пропустить и вернуться
    к ним позже с `openclaw configure`.

    Если процесс завис, используйте [Установщик завис](#quick-start-and-first-run-setup)
    и быстрый цикл отладки в [Я застрял](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Установщик завис? Как получить больше обратной связи?">
    Повторно запустите установщик с **подробным выводом**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Установка beta с подробным выводом:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Для установки, доступной для изменения (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Эквивалент для Windows (PowerShell):

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Больше вариантов: [Флаги установщика](/ru/install/installer).

  </Accordion>

  <Accordion title="Установка в Windows сообщает, что git не найден или openclaw не распознан">
    Две распространенные проблемы в Windows:

    **1) npm error spawn git / git not found**

    - Установите **Git for Windows** и убедитесь, что `git` есть в вашем PATH.
    - Закройте и снова откройте PowerShell, затем повторно запустите установщик.

    **2) openclaw не распознан после установки**

    - Папка npm global bin отсутствует в PATH.
    - Проверьте путь:

      ```powershell
      npm config get prefix
      ```

    - Добавьте этот каталог в пользовательский PATH (в Windows суффикс `\bin` не нужен; на большинстве систем это `%AppData%\npm`).
    - После обновления PATH закройте и снова откройте PowerShell.

    Для настройки рабочего стола используйте нативное приложение **Windows Hub**. Для настройки
    только через терминал поддерживаются и установщик PowerShell, и пути WSL2 Gateway.
    Документация: [Windows](/ru/platforms/windows).

  </Accordion>

  <Accordion title="Вывод exec в Windows показывает искаженный китайский текст — что делать?">
    Обычно это несоответствие кодовой страницы консоли в нативных оболочках Windows.

    Симптомы:

    - Вывод `system.run`/`exec` отображает китайский текст как mojibake
    - Та же команда выглядит нормально в другом профиле терминала

    Быстрый обходной путь в PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Затем перезапустите Gateway и повторите команду:

    ```powershell
    openclaw gateway restart
    ```

    Если это все еще воспроизводится на последней версии OpenClaw, отслеживайте/сообщайте об этом здесь:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Документация не ответила на мой вопрос — как получить ответ лучше?">
    Используйте **установку, доступную для изменения (git)**, чтобы весь исходный код и документация были локально, затем спросите
    своего бота (или Claude/Codex) _из этой папки_, чтобы он мог прочитать репозиторий и ответить точно.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Подробнее: [Установка](/ru/install) и [Флаги установщика](/ru/install/installer).

  </Accordion>

  <Accordion title="Как установить OpenClaw в Linux?">
    Короткий ответ: следуйте руководству для Linux, затем запустите первичную настройку.

    - Быстрый путь Linux + установка сервиса: [Linux](/ru/platforms/linux).
    - Полное пошаговое руководство: [Начало работы](/ru/start/getting-started).
    - Установщик + обновления: [Установка и обновления](/ru/install/updating).

  </Accordion>

  <Accordion title="Как установить OpenClaw на VPS?">
    Подойдет любой Linux VPS. Установите на сервере, затем используйте SSH/Tailscale для доступа к Gateway.

    Руководства: [exe.dev](/ru/install/exe-dev), [Hetzner](/ru/install/hetzner), [Fly.io](/ru/install/fly).
    Удаленный доступ: [Удаленный Gateway](/ru/gateway/remote).

  </Accordion>

  <Accordion title="Где руководства по установке в облаке/VPS?">
    Мы поддерживаем **хаб хостинга** с распространенными провайдерами. Выберите один и следуйте руководству:

    - [VPS-хостинг](/ru/vps) (все провайдеры в одном месте)
    - [Fly.io](/ru/install/fly)
    - [Hetzner](/ru/install/hetzner)
    - [exe.dev](/ru/install/exe-dev)

    Как это работает в облаке: **Gateway работает на сервере**, а вы обращаетесь к нему
    с ноутбука/телефона через Control UI (или Tailscale/SSH). Ваше состояние + рабочая область
    находятся на сервере, поэтому считайте хост источником истины и делайте резервные копии.

    Вы можете привязать **узлы** (Mac/iOS/Android/headless) к этому облачному Gateway, чтобы получать доступ
    к локальному экрану/камере/canvas или выполнять команды на ноутбуке, сохраняя
    Gateway в облаке.

    Хаб: [Платформы](/ru/platforms). Удаленный доступ: [Удаленный Gateway](/ru/gateway/remote).
    Узлы: [Узлы](/ru/nodes), [CLI узлов](/ru/cli/nodes).

  </Accordion>

  <Accordion title="Могу ли я попросить OpenClaw обновить себя?">
    Короткий ответ: **возможно, но не рекомендуется**. Поток обновления может перезапустить
    Gateway (что прерывает активную сессию), может потребовать чистый git checkout и
    может запросить подтверждение. Безопаснее: запускать обновления из оболочки от имени оператора.

    Используйте CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Если нужно автоматизировать из агента:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Документация: [Обновление](/ru/cli/update), [Обновление](/ru/install/updating).

  </Accordion>

  <Accordion title="Что на самом деле делает первичная настройка?">
    `openclaw onboard` — рекомендуемый путь настройки. В **локальном режиме** он проводит вас через:

    - **Настройку модели/авторизации** (OAuth провайдера, API-ключи, setup-token Anthropic, а также варианты локальных моделей, такие как LM Studio)
    - Расположение **рабочей области** + bootstrap-файлы
    - **Настройки Gateway** (bind/port/auth/tailscale)
    - **Каналы** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, а также встроенные channel plugins, например QQ Bot)
    - **Установку daemon** (LaunchAgent на macOS; пользовательский unit systemd в Linux/WSL2)
    - **Проверки состояния** и выбор **Skills**

    Он также задает ожидания по длительности до начала основных запросов и предупреждает, если ваша
    настроенная модель неизвестна или для нее отсутствует авторизация.

  </Accordion>

  <Accordion title="Нужна ли подписка Claude или OpenAI, чтобы это запускать?">
    Нет. OpenClaw можно запускать с **API-ключами** (Anthropic/OpenAI/другие) или с
    **только локальными моделями**, чтобы ваши данные оставались на вашем устройстве. Подписки (Claude
    Pro/Max или OpenAI Codex) — это необязательные способы аутентификации у этих провайдеров.

    Для Anthropic в OpenClaw практическое разделение такое:

    - **API-ключ Anthropic**: обычный биллинг Anthropic API
    - **Claude CLI / авторизация подписки Claude в OpenClaw**: сотрудники Anthropic
      сообщили нам, что такое использование снова разрешено, и OpenClaw считает использование `claude -p`
      санкционированным для этой интеграции, если Anthropic не опубликует новую
      политику

    Для долго работающих хостов Gateway API-ключи Anthropic все еще остаются более
    предсказуемой настройкой. OAuth OpenAI Codex явно поддерживается для внешних
    инструментов вроде OpenClaw.

    OpenClaw также поддерживает другие размещенные варианты в стиле подписки, включая
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** и
    **Z.AI / GLM Coding Plan**.

    Документация: [Anthropic](/ru/providers/anthropic), [OpenAI](/ru/providers/openai),
    [Qwen Cloud](/ru/providers/qwen),
    [MiniMax](/ru/providers/minimax), [Z.AI (GLM)](/ru/providers/zai),
    [Локальные модели](/ru/gateway/local-models), [Модели](/ru/concepts/models).

  </Accordion>

  <Accordion title="Можно ли использовать подписку Claude Max без API-ключа?">
    Да.

    Сотрудники Anthropic сообщили нам, что использование Claude CLI в стиле OpenClaw снова разрешено, поэтому
    OpenClaw считает авторизацию через подписку Claude и использование `claude -p` санкционированными
    для этой интеграции, если Anthropic не опубликует новую политику. Если вам нужна
    максимально предсказуемая серверная настройка, вместо этого используйте API-ключ Anthropic.

  </Accordion>

  <Accordion title="Поддерживается ли авторизация через подписку Claude (Claude Pro или Max)?">
    Да.

    Сотрудники Anthropic сообщили нам, что такое использование снова разрешено, поэтому OpenClaw считает
    повторное использование Claude CLI и использование `claude -p` санкционированными для этой интеграции,
    если Anthropic не опубликует новую политику.

    Anthropic setup-token все еще доступен как поддерживаемый путь токена OpenClaw, но теперь OpenClaw предпочитает повторное использование Claude CLI и `claude -p`, когда они доступны.
    Для production- или многопользовательских нагрузок авторизация через API-ключ Anthropic все еще
    остается более безопасным и предсказуемым выбором. Если вам нужны другие размещенные
    варианты в стиле подписки в OpenClaw, смотрите [OpenAI](/ru/providers/openai), [Qwen / Model
    Cloud](/ru/providers/qwen), [MiniMax](/ru/providers/minimax) и [GLM
    Models](/ru/providers/zai).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

  <AccordionGroup>
  <Accordion title="Почему я вижу HTTP 429 rate_limit_error от Anthropic?">
    Это означает, что ваша **квота/ограничение скорости Anthropic** исчерпана для текущего окна. Если вы
    используете **Claude CLI**, дождитесь сброса окна или повысьте тариф. Если вы
    используете **API-ключ Anthropic**, проверьте Anthropic Console
    для данных об использовании/оплате и при необходимости увеличьте лимиты.

    Если сообщение выглядит именно так:
    `Extra usage is required for long context requests`, запрос пытается использовать
    контекстное окно Anthropic на 1M (модель Claude 4.x с поддержкой GA для 1M или устаревшую
    конфигурацию `context1m: true`). Это работает только тогда, когда ваши учетные данные подходят
    для тарификации длинного контекста (оплата по API-ключу или путь входа OpenClaw через Claude
    с включенным Extra Usage).

    Совет: задайте **резервную модель**, чтобы OpenClaw мог продолжать отвечать, пока провайдер ограничен по скорости.
    См. [Модели](/ru/cli/models), [OAuth](/ru/concepts/oauth) и
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/ru/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Поддерживается ли AWS Bedrock?">
    Да. В OpenClaw есть встроенный провайдер **Amazon Bedrock (Converse)**. При наличии маркеров окружения AWS OpenClaw может автоматически обнаруживать потоковый/текстовый каталог Bedrock и объединять его как неявного провайдера `amazon-bedrock`; иначе вы можете явно включить `plugins.entries.amazon-bedrock.config.discovery.enabled` или добавить запись провайдера вручную. См. [Amazon Bedrock](/ru/providers/bedrock) и [Провайдеры моделей](/ru/providers/models). Если вы предпочитаете управляемый поток ключей, OpenAI-совместимый прокси перед Bedrock также остается допустимым вариантом.
  </Accordion>

  <Accordion title="Как работает аутентификация Codex?">
    OpenClaw поддерживает **OpenAI Code (Codex)** через OAuth (вход ChatGPT). Используйте
    `openai/gpt-5.5` для типичной настройки: аутентификация по подписке ChatGPT/Codex плюс
    нативное выполнение через сервер приложения Codex. Устаревшие ссылки Codex GPT являются
    устаревшей конфигурацией, которую исправляет `openclaw doctor --fix`. Прямой доступ по API-ключу OpenAI
    остается доступен для поверхностей OpenAI API без агента и для агентных
    моделей через упорядоченный профиль API-ключа `openai`.
    См. [Провайдеры моделей](/ru/concepts/model-providers) и [Первичная настройка (CLI)](/ru/start/wizard).
  </Accordion>

  <Accordion title="Почему OpenClaw все еще упоминает устаревший префикс OpenAI Codex?">
    `openai` — это идентификатор провайдера и профиля аутентификации как для API-ключей OpenAI, так и для
    ChatGPT/Codex OAuth. Вы все еще можете видеть устаревший префикс OpenAI Codex в устаревшей конфигурации и
    предупреждениях миграции.
    В старых конфигурациях он также использовался как префикс модели:

    - `openai/gpt-5.5` = аутентификация по подписке ChatGPT/Codex с нативной средой выполнения Codex для ходов агента
    - устаревшая ссылка Codex GPT-5.5 = устаревший маршрут модели, исправляемый `openclaw doctor --fix`
    - `openai/gpt-5.5` плюс упорядоченный профиль API-ключа `openai` = аутентификация по API-ключу для агентной модели OpenAI
    - устаревшие идентификаторы профилей аутентификации Codex = устаревший идентификатор профиля аутентификации, переносимый `openclaw doctor --fix`

    Если вам нужен прямой путь оплаты/лимитов OpenAI Platform, задайте
    `OPENAI_API_KEY`. Если вам нужна аутентификация по подписке ChatGPT/Codex, войдите с помощью
    `openclaw models auth login --provider openai`. Оставьте ссылку модели как
    `openai/gpt-5.5`; устаревшие ссылки моделей Codex — это устаревшая конфигурация, которую
    `openclaw doctor --fix` перезаписывает.

  </Accordion>

  <Accordion title="Почему лимиты Codex OAuth могут отличаться от ChatGPT в вебе?">
    Codex OAuth использует управляемые OpenAI окна квот, зависящие от тарифа. На практике
    эти лимиты могут отличаться от опыта на сайте/в приложении ChatGPT, даже когда
    оба привязаны к одной учетной записи.

    OpenClaw может показывать текущие видимые окна использования/квоты провайдера в
    `openclaw models status`, но он не придумывает и не нормализует права ChatGPT в вебе
    в прямой доступ к API. Если вам нужен прямой путь оплаты/лимитов OpenAI Platform,
    используйте `openai/*` с API-ключом.

  </Accordion>

  <Accordion title="Поддерживаете ли вы аутентификацию по подписке OpenAI (Codex OAuth)?">
    Да. OpenClaw полностью поддерживает **OAuth по подписке OpenAI Code (Codex)**.
    OpenAI явно разрешает использование OAuth по подписке во внешних инструментах/рабочих процессах,
    таких как OpenClaw. Первичная настройка может выполнить поток OAuth за вас.

    См. [OAuth](/ru/concepts/oauth), [Провайдеры моделей](/ru/concepts/model-providers) и [Первичная настройка (CLI)](/ru/start/wizard).

  </Accordion>

  <Accordion title="Как настроить Gemini CLI OAuth?">
    Gemini CLI использует **поток аутентификации Plugin**, а не client id или secret в `openclaw.json`.

    Шаги:

    1. Установите Gemini CLI локально, чтобы `gemini` был в `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Включите Plugin: `openclaw plugins enable google`
    3. Войдите: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Модель по умолчанию после входа: `google-gemini-cli/gemini-3-flash-preview`
    5. Если запросы завершаются ошибкой, задайте `GOOGLE_CLOUD_PROJECT` или `GOOGLE_CLOUD_PROJECT_ID` на хосте Gateway

    Это сохраняет токены OAuth в профилях аутентификации на хосте Gateway. Подробности: [Провайдеры моделей](/ru/concepts/model-providers).

  </Accordion>

  <Accordion title="Подходит ли локальная модель для обычных чатов?">
    Обычно нет. OpenClaw нужны большой контекст и строгая безопасность; маленькие карты обрезают контекст и допускают утечки. Если необходимо, запускайте **самую большую** сборку модели, которую можете локально (LM Studio), и см. [/gateway/local-models](/ru/gateway/local-models). Модели меньшего размера/квантованные модели повышают риск prompt-injection — см. [Безопасность](/ru/gateway/security).
  </Accordion>

  <Accordion title="Как удерживать трафик размещенной модели в конкретном регионе?">
    Выбирайте конечные точки, закрепленные за регионом. OpenRouter предоставляет размещенные в США варианты для MiniMax, Kimi и GLM; выберите вариант, размещенный в США, чтобы держать данные внутри региона. Вы по-прежнему можете перечислить Anthropic/OpenAI рядом с ними, используя `models.mode: "merge"`, чтобы резервные варианты оставались доступны с учетом выбранного регионального провайдера.
  </Accordion>

  <Accordion title="Нужно ли покупать Mac Mini, чтобы это установить?">
    Нет. OpenClaw работает на macOS или Linux (Windows через WSL2). Mac mini необязателен — некоторые люди
    покупают его как постоянно включенный хост, но небольшой VPS, домашний сервер или устройство класса Raspberry Pi тоже подойдет.

    Mac нужен только **для инструментов, доступных только на macOS**. Для iMessage используйте [iMessage](/ru/channels/imessage) с `imsg` на любом Mac, где выполнен вход в Messages. Если Gateway работает на Linux или в другом месте, задайте `channels.imessage.cliPath` как SSH-обертку, запускающую `imsg` на этом Mac. Если вам нужны другие инструменты только для macOS, запускайте Gateway на Mac или подключите узел macOS.

    Документация: [iMessage](/ru/channels/imessage), [Узлы](/ru/nodes), [Удаленный режим Mac](/ru/platforms/mac/remote).

  </Accordion>

  <Accordion title="Нужен ли Mac mini для поддержки iMessage?">
    Вам нужно **какое-либо устройство macOS**, где выполнен вход в Messages. Это **не обязательно** должен быть Mac mini —
    подойдет любой Mac. **Используйте [iMessage](/ru/channels/imessage)** с `imsg`; Gateway может работать на этом Mac или в другом месте с SSH-оберткой `cliPath`.

    Типичные настройки:

    - Запустите Gateway на Linux/VPS и задайте `channels.imessage.cliPath` как SSH-обертку, запускающую `imsg` на Mac, где выполнен вход в Messages.
    - Запустите все на Mac, если хотите самую простую настройку на одной машине.

    Документация: [iMessage](/ru/channels/imessage), [Узлы](/ru/nodes),
    [Удаленный режим Mac](/ru/platforms/mac/remote).

  </Accordion>

  <Accordion title="Если я куплю Mac mini для запуска OpenClaw, смогу ли подключить его к моему MacBook Pro?">
    Да. **Mac mini может запускать Gateway**, а ваш MacBook Pro может подключаться как
    **узел** (сопутствующее устройство). Узлы не запускают Gateway — они предоставляют дополнительные
    возможности, такие как экран/камера/холст и `system.run` на этом устройстве.

    Типичный шаблон:

    - Gateway на Mac mini (постоянно включен).
    - MacBook Pro запускает приложение macOS или хост узла и подключается к Gateway.
    - Используйте `openclaw nodes status` / `openclaw nodes list`, чтобы увидеть его.

    Документация: [Узлы](/ru/nodes), [CLI узлов](/ru/cli/nodes).

  </Accordion>

  <Accordion title="Можно ли использовать Bun?">
    Bun **не рекомендуется**. Мы наблюдаем ошибки среды выполнения, особенно с WhatsApp и Telegram.
    Используйте **Node** для стабильных Gateway.

    Если вы все же хотите поэкспериментировать с Bun, делайте это на непроизводственном Gateway
    без WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: что указывать в allowFrom?">
    `channels.telegram.allowFrom` — это **Telegram user ID отправителя-человека** (числовой). Это не имя пользователя бота.

    Настройка запрашивает только числовые user ID. Если в конфигурации уже есть устаревшие записи `@username`, `openclaw doctor --fix` может попытаться их разрешить.

    Безопаснее (без стороннего бота):

    - Напишите вашему боту в личные сообщения, затем выполните `openclaw logs --follow` и прочитайте `from.id`.

    Официальный Bot API:

    - Напишите вашему боту в личные сообщения, затем вызовите `https://api.telegram.org/bot<bot_token>/getUpdates` и прочитайте `message.from.id`.

    Сторонний вариант (менее приватный):

    - Напишите `@userinfobot` или `@getidsbot` в личные сообщения.

    См. [/channels/telegram](/ru/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Могут ли несколько людей использовать один номер WhatsApp с разными экземплярами OpenClaw?">
    Да, через **маршрутизацию нескольких агентов**. Привяжите **личный чат** WhatsApp каждого отправителя (peer `kind: "direct"`, отправитель E.164 вроде `+15551234567`) к разному `agentId`, чтобы у каждого человека были собственная рабочая область и хранилище сессий. Ответы по-прежнему приходят из **одной учетной записи WhatsApp**, а контроль доступа к личным чатам (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) глобален для каждой учетной записи WhatsApp. См. [Маршрутизация нескольких агентов](/ru/concepts/multi-agent) и [WhatsApp](/ru/channels/whatsapp).
  </Accordion>

  <Accordion title='Можно ли запустить агента "быстрый чат" и агента "Opus для кодинга"?'>
    Да. Используйте маршрутизацию нескольких агентов: задайте каждому агенту собственную модель по умолчанию, затем привяжите входящие маршруты (учетную запись провайдера или конкретных peer) к каждому агенту. Пример конфигурации находится в [Маршрутизация нескольких агентов](/ru/concepts/multi-agent). См. также [Модели](/ru/concepts/models) и [Конфигурация](/ru/gateway/configuration).
  </Accordion>

  <Accordion title="Работает ли Homebrew на Linux?">
    Да. Homebrew поддерживает Linux (Linuxbrew). Быстрая настройка:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Если вы запускаете OpenClaw через systemd, убедитесь, что PATH сервиса включает `/home/linuxbrew/.linuxbrew/bin` (или ваш префикс brew), чтобы инструменты, установленные через `brew`, разрешались в non-login shell.
    Недавние сборки также добавляют в начало распространенные пользовательские каталоги bin в сервисах Linux systemd (например, `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) и учитывают `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` и `FNM_DIR`, когда они заданы.

  </Accordion>

  <Accordion title="Разница между hackable git-установкой и npm-установкой">
    - **Hackable (git) установка:** полная рабочая копия исходного кода, редактируемая, лучше всего подходит для контрибьюторов.
      Вы запускаете сборки локально и можете исправлять код/документацию.
    - **npm-установка:** глобальная установка CLI, без репозитория, лучше всего подходит для варианта "просто запустить".
      Обновления поступают из dist-tags npm.

    Документация: [Начало работы](/ru/start/getting-started), [Обновление](/ru/install/updating).

  </Accordion>

  <Accordion title="Можно ли позже переключаться между npm- и git-установками?">
    Да. Используйте `openclaw update --channel ...`, когда OpenClaw уже установлен.
    Это **не удаляет ваши данные** — меняется только установленный код OpenClaw.
    Ваше состояние (`~/.openclaw`) и рабочая область (`~/.openclaw/workspace`) остаются нетронутыми.

    С npm на git:

    ```bash
    openclaw update --channel dev
    ```

    С git на npm:

    ```bash
    openclaw update --channel stable
    ```

    Добавьте `--dry-run`, чтобы сначала предварительно просмотреть запланированное переключение режима. Обновлятор выполняет
    последующие действия Doctor, обновляет источники плагинов для целевого канала и
    перезапускает Gateway, если вы не передали `--no-restart`.

    Установщик тоже может принудительно выбрать любой режим:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Советы по резервному копированию: см. [стратегию резервного копирования](/ru/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Запускать Gateway на ноутбуке или VPS?">
    Короткий ответ: **если вам нужна надежность 24/7, используйте VPS**. Если вам нужна
    минимальная сложность и вас устраивают сон/перезапуски, запускайте его локально.

    **Ноутбук (локальный Gateway)**

    - **Плюсы:** нет расходов на сервер, прямой доступ к локальным файлам, живое окно браузера.
    - **Минусы:** сон/обрывы сети = отключения, обновления/перезагрузки ОС прерывают работу, устройство должно оставаться включенным.

    **VPS / облако**

    - **Плюсы:** всегда включен, стабильная сеть, нет проблем со сном ноутбука, проще поддерживать непрерывную работу.
    - **Минусы:** часто работает без графического интерфейса (используйте скриншоты), только удаленный доступ к файлам, для обновлений нужно подключаться по SSH.

    **Примечание для OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord отлично работают с VPS. Единственный реальный компромисс — **безголовый браузер** или видимое окно. См. [Браузер](/ru/tools/browser).

    **Рекомендуемое значение по умолчанию:** VPS, если раньше у вас были отключения Gateway. Локальный запуск отлично подходит, когда вы активно используете Mac и хотите доступ к локальным файлам или UI-автоматизацию с видимым браузером.

  </Accordion>

  <Accordion title="Насколько важно запускать OpenClaw на выделенной машине?">
    Это не обязательно, но **рекомендуется для надежности и изоляции**.

    - **Выделенный хост (VPS/Mac mini/Raspberry Pi):** всегда включен, меньше прерываний из-за сна/перезагрузок, чище права доступа, проще поддерживать непрерывную работу.
    - **Общий ноутбук/настольный компьютер:** вполне подходит для тестирования и активного использования, но ожидайте пауз, когда машина засыпает или обновляется.

    Если вы хотите лучшее из обоих вариантов, держите Gateway на выделенном хосте и подключите ноутбук как **Node** для локальных инструментов экрана/камеры/exec. См. [Nodes](/ru/nodes).
    Рекомендации по безопасности см. в разделе [Безопасность](/ru/gateway/security).

  </Accordion>

  <Accordion title="Каковы минимальные требования к VPS и рекомендуемая ОС?">
    OpenClaw легковесен. Для базового Gateway + одного чат-канала:

    - **Абсолютный минимум:** 1 vCPU, 1 ГБ RAM, ~500 МБ диска.
    - **Рекомендуется:** 1-2 vCPU, 2 ГБ RAM или больше для запаса (логи, медиа, несколько каналов). Инструменты Node и автоматизация браузера могут требовать много ресурсов.

    ОС: используйте **Ubuntu LTS** (или любой современный Debian/Ubuntu). Путь установки для Linux лучше всего протестирован там.

    Документация: [Linux](/ru/platforms/linux), [VPS-хостинг](/ru/vps).

  </Accordion>

  <Accordion title="Можно ли запускать OpenClaw в VM и каковы требования?">
    Да. Относитесь к VM так же, как к VPS: она должна быть всегда включена, доступна и иметь достаточно
    RAM для Gateway и любых включенных каналов.

    Базовые рекомендации:

    - **Абсолютный минимум:** 1 vCPU, 1 ГБ RAM.
    - **Рекомендуется:** 2 ГБ RAM или больше, если вы запускаете несколько каналов, автоматизацию браузера или медиа-инструменты.
    - **ОС:** Ubuntu LTS или другой современный Debian/Ubuntu.

    Если вы работаете в Windows, используйте **Windows Hub** для настройки рабочего стола или WSL2, когда
    вам специально нужна VM Gateway в стиле Linux с широкой совместимостью
    инструментов. См. [Windows](/ru/platforms/windows), [VPS-хостинг](/ru/vps).
    Если вы запускаете macOS в VM, см. [macOS VM](/ru/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Связанное

- [FAQ](/ru/help/faq) — основной FAQ (модели, сессии, Gateway, безопасность и другое)
- [Обзор установки](/ru/install)
- [Начало работы](/ru/start/getting-started)
- [Устранение неполадок](/ru/help/troubleshooting)
