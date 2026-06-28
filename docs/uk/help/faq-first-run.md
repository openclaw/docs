---
read_when:
    - Нове встановлення, зависання під час початкового налаштування або помилки першого запуску
    - Вибір автентифікації та підписок провайдерів
    - Немає доступу до docs.openclaw.ai, не відкривається панель керування, встановлення зависло
sidebarTitle: First-run FAQ
summary: 'Поширені запитання: швидкий старт і налаштування першого запуску — інсталяція, онбординг, автентифікація, підписки, початкові збої'
title: 'Поширені запитання: налаштування першого запуску'
x-i18n:
    generated_at: "2026-06-28T20:43:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ef4122bc0c3068806591ccdc1bf7f3eb5a81cc7efd2066d07f948fe953284be
    source_path: help/faq-first-run.md
    workflow: 16
---

  Питання й відповіді для швидкого старту та першого запуску. Для повсякденних операцій, моделей, автентифікації, сесій
  і усунення несправностей див. основний [FAQ](/uk/help/faq).

  ## Швидкий старт і налаштування першого запуску

  <AccordionGroup>
  <Accordion title="I am stuck, fastest way to get unstuck">
    Використайте локального AI-агента, який може **бачити ваш комп’ютер**. Це значно ефективніше, ніж питати
    в Discord, бо більшість випадків "я застряг" є **проблемами локальної конфігурації або середовища**, які
    віддалені помічники не можуть перевірити.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Ці інструменти можуть читати репозиторій, запускати команди, переглядати журнали й допомагати виправляти налаштування
    на рівні вашого комп’ютера (PATH, служби, дозволи, файли автентифікації). Надайте їм **повну робочу копію вихідного коду** через
    hackable (git) встановлення:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це встановлює OpenClaw **з git checkout**, тож агент може читати код + документацію й
    міркувати про точну версію, яку ви запускаєте. Ви завжди можете повернутися до стабільної версії пізніше,
    повторно запустивши інсталятор без `--install-method git`.

    Порада: попросіть агента **спланувати й контролювати** виправлення (крок за кроком), а потім виконувати лише
    необхідні команди. Це зберігає зміни невеликими й полегшує їх аудит.

    Якщо ви виявили справжню помилку або виправлення, створіть issue на GitHub або надішліть PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Почніть із цих команд (діліться виводом, коли просите допомоги):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Що вони роблять:

    - `openclaw status`: швидкий знімок стану gateway/агента + базової конфігурації.
    - `openclaw models status`: перевіряє автентифікацію провайдера + доступність моделей.
    - `openclaw doctor`: перевіряє та виправляє поширені проблеми конфігурації/стану.

    Інші корисні CLI-перевірки: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Швидкий цикл налагодження: [Перші 60 секунд, якщо щось зламано](/uk/help/faq#first-60-seconds-if-something-is-broken).
    Документація встановлення: [Встановлення](/uk/install), [Прапорці інсталятора](/uk/install/installer), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Heartbeat keeps skipping. What do the skip reasons mean?">
    Поширені причини пропуску heartbeat:

    - `quiet-hours`: поза налаштованим вікном активних годин
    - `empty-heartbeat-file`: `HEARTBEAT.md` існує, але містить лише порожні рядки, коментарі, заголовок, fence або порожній шаблон контрольного списку
    - `no-tasks-due`: режим завдань `HEARTBEAT.md` активний, але жоден з інтервалів завдань ще не настав
    - `alerts-disabled`: усю видимість heartbeat вимкнено (`showOk`, `showAlerts` і `useIndicator` усі вимкнені)

    У режимі завдань мітки часу виконання просуваються лише після завершення справжнього запуску heartbeat.
    Пропущені запуски не позначають завдання як виконані.

    Документація: [Heartbeat](/uk/gateway/heartbeat), [Автоматизація](/uk/automation).

  </Accordion>

  <Accordion title="Recommended way to install and set up OpenClaw">
    Репозиторій рекомендує запуск із вихідного коду та використання onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Майстер також може автоматично зібрати UI-ресурси. Після onboarding ви зазвичай запускаєте Gateway на порту **18789**.

    З вихідного коду (для контриб’юторів/розробки):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Якщо у вас ще немає глобального встановлення, запустіть через `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="How do I open the dashboard after onboarding?">
    Майстер відкриває браузер із чистою (без токена) URL-адресою панелі відразу після onboarding, а також друкує посилання в підсумку. Тримайте цю вкладку відкритою; якщо вона не запустилася, скопіюйте та вставте надруковану URL-адресу на тому самому комп’ютері.
  </Accordion>

  <Accordion title="How do I authenticate the dashboard on localhost vs remote?">
    **Localhost (той самий комп’ютер):**

    - Відкрийте `http://127.0.0.1:18789/`.
    - Якщо запитує автентифікацію зі shared secret, вставте налаштований токен або пароль у налаштування Control UI.
    - Джерело токена: `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`).
    - Джерело пароля: `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо shared secret ще не налаштовано, згенеруйте токен за допомогою `openclaw doctor --generate-gateway-token`.

    **Не на localhost:**

    - **Tailscale Serve** (рекомендовано): залиште bind на loopback, запустіть `openclaw gateway --tailscale serve`, відкрийте `https://<magicdns>/`. Якщо `gateway.auth.allowTailscale` має значення `true`, заголовки ідентичності задовольняють автентифікацію Control UI/WebSocket (без вставленого shared secret, передбачає довірений gateway-хост); HTTP API все одно потребують автентифікації зі shared secret, якщо ви навмисно не використовуєте private-ingress `none` або trusted-proxy HTTP auth.
      Невдалі одночасні спроби автентифікації Serve від того самого клієнта серіалізуються до того, як обмежувач невдалої автентифікації їх запише, тому друга невдала повторна спроба вже може показати `retry later`.
    - **Tailnet bind**: запустіть `openclaw gateway --bind tailnet --token "<token>"` (або налаштуйте автентифікацію паролем), відкрийте `http://<tailscale-ip>:18789/`, а потім вставте відповідний shared secret у налаштуваннях панелі.
    - **Reverse proxy з урахуванням ідентичності**: тримайте Gateway за довіреним proxy, налаштуйте `gateway.auth.mode: "trusted-proxy"`, а потім відкрийте URL proxy. Same-host loopback proxy потребують явного `gateway.auth.trustedProxy.allowLoopback = true`.
    - **SSH-тунель**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, а потім відкрийте `http://127.0.0.1:18789/`. Автентифікація зі shared secret усе одно застосовується через тунель; вставте налаштований токен або пароль, якщо буде запит.

    Див. [Панель](/uk/web/dashboard) і [Веб-поверхні](/uk/web) для режимів bind і деталей автентифікації.

  </Accordion>

  <Accordion title="Why are there two exec approval configs for chat approvals?">
    Вони керують різними рівнями:

    - `approvals.exec`: пересилає запити на approval до чатів призначення
    - `channels.<channel>.execApprovals`: змушує цей канал діяти як нативний клієнт approval для exec approvals

    Політика exec на хості все ще є справжнім шлюзом approval. Конфігурація чату лише керує тим, де з’являються
    запити на approval і як люди можуть відповідати на них.

    У більшості налаштувань вам **не** потрібні обидва:

    - Якщо чат уже підтримує команди й відповіді, same-chat `/approve` працює через спільний шлях.
    - Якщо підтримуваний нативний канал може безпечно визначати approvers, OpenClaw тепер автоматично вмикає DM-first нативні approvals, коли `channels.<channel>.execApprovals.enabled` не задано або має значення `"auto"`.
    - Коли доступні нативні картки/кнопки approval, цей нативний UI є основним шляхом; агент має включати ручну команду `/approve` лише якщо результат інструмента каже, що chat approvals недоступні або ручне approval є єдиним шляхом.
    - Використовуйте `approvals.exec` лише коли запити також потрібно пересилати до інших чатів або явних ops-кімнат.
    - Використовуйте `channels.<channel>.execApprovals.target: "channel"` або `"both"` лише коли ви явно хочете, щоб запити approval публікувалися назад у початкову кімнату/тему.
    - Plugin approvals знову окремі: вони типово використовують same-chat `/approve`, необов’язкове пересилання `approvals.plugin`, і лише деякі нативні канали зберігають plugin-approval-native обробку поверх цього.

    Коротко: пересилання призначене для маршрутизації, а конфігурація нативного клієнта — для багатшого UX, специфічного для каналу.
    Див. [Exec Approvals](/uk/tools/exec-approvals).

  </Accordion>

  <Accordion title="What runtime do I need?">
    Потрібен Node **>= 22**. Рекомендовано `pnpm`. Bun **не рекомендовано** для Gateway.
  </Accordion>

  <Accordion title="Does it run on Raspberry Pi?">
    Так. Gateway легковагий — документація вказує **512MB-1GB RAM**, **1 ядро** і приблизно **500MB**
    диска як достатні для особистого використання, а також зазначає, що **Raspberry Pi 4 може його запускати**.

    Якщо вам потрібен додатковий запас (журнали, медіа, інші служби), **рекомендовано 2GB**, але це
    не жорсткий мінімум.

    Порада: невеликий Raspberry Pi/VPS може хостити Gateway, а ви можете підключити **вузли** на ноутбуці/телефоні для
    локального екрана/камери/canvas або виконання команд. Див. [Вузли](/uk/nodes).

  </Accordion>

  <Accordion title="Any tips for Raspberry Pi installs?">
    Коротко: це працює, але очікуйте шорстких місць.

    - Використовуйте **64-bit** ОС і тримайте Node >= 22.
    - Надавайте перевагу **hackable (git) встановленню**, щоб бачити журнали й швидко оновлюватися.
    - Почніть без каналів/skills, потім додавайте їх по одному.
    - Якщо натрапите на дивні проблеми з бінарними файлами, зазвичай це проблема **ARM-сумісності**.

    Документація: [Linux](/uk/platforms/linux), [Встановлення](/uk/install).

  </Accordion>

  <Accordion title="It is stuck on wake up my friend / onboarding will not hatch. What now?">
    Цей екран залежить від того, чи Gateway доступний і автентифікований. TUI також автоматично надсилає
    "Wake up, my friend!" під час першого hatch. Якщо ви бачите цей рядок **без відповіді**
    і токени залишаються на 0, агент ніколи не запускався.

    1. Перезапустіть Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Перевірте стан + автентифікацію:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Якщо все ще зависає, запустіть:

    ```bash
    openclaw doctor
    ```

    Якщо Gateway віддалений, переконайтеся, що тунель/з’єднання Tailscale активне і що UI
    вказує на правильний Gateway. Див. [Віддалений доступ](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Can I migrate my setup to a new machine (Mac mini) without redoing onboarding?">
    Так. Скопіюйте **каталог стану** і **робочий простір**, а потім один раз запустіть Doctor. Це
    зберігає вашого бота "точно таким самим" (пам’ять, історію сесій, автентифікацію та стан каналу),
    якщо ви скопіюєте **обидва** розташування:

    1. Встановіть OpenClaw на новому комп’ютері.
    2. Скопіюйте `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`) зі старого комп’ютера.
    3. Скопіюйте свій робочий простір (типово: `~/.openclaw/workspace`).
    4. Запустіть `openclaw doctor` і перезапустіть службу Gateway.

    Це зберігає конфігурацію, профілі автентифікації, облікові дані WhatsApp, сесії та пам’ять. Якщо ви в
    віддаленому режимі, пам’ятайте, що gateway-хост володіє сховищем сесій і робочим простором.

    **Важливо:** якщо ви лише commit/push свій робочий простір на GitHub, ви створюєте резервну копію
    **пам’яті + bootstrap-файлів**, але **не** історії сесій або автентифікації. Вони живуть
    у `~/.openclaw/` (наприклад, `~/.openclaw/agents/<agentId>/sessions/`).

    Пов’язано: [Міграція](/uk/install/migrating), [Де все зберігається на диску](/uk/help/faq#where-things-live-on-disk),
    [Робочий простір агента](/uk/concepts/agent-workspace), [Doctor](/uk/gateway/doctor),
    [Віддалений режим](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Where do I see what is new in the latest version?">
    Перевірте changelog на GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Найновіші записи розташовані вгорі. Якщо верхній розділ позначено **Unreleased**, наступний датований
    розділ є останньою випущеною версією. Записи згруповано за **Highlights**, **Changes** і
    **Fixes** (плюс розділи документації/іншого за потреби).

  </Accordion>

  <Accordion title="Cannot access docs.openclaw.ai (SSL error)">
    Деякі з’єднання Comcast/Xfinity неправильно блокують `docs.openclaw.ai` через Xfinity
    Advanced Security. Вимкніть це або додайте `docs.openclaw.ai` до allowlist, а потім повторіть спробу.
    Допоможіть нам розблокувати це, повідомивши тут: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Якщо ви все ще не можете відкрити сайт, документацію віддзеркалено на GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Різниця між stable і beta">
    **Stable** і **beta** — це **npm dist-tags**, а не окремі гілки коду:

    - `latest` = stable
    - `beta` = рання збірка для тестування

    Зазвичай стабільний реліз спершу потрапляє в **beta**, а потім окремий
    крок просування переміщує ту саму версію в `latest`. Мейнтейнери також можуть
    публікувати прямо в `latest`, коли це потрібно. Саме тому beta і stable можуть
    вказувати на **ту саму версію** після просування.

    Дивіться, що змінилося:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Однорядкові команди встановлення та різницю між beta і dev дивіться в акордеоні нижче.

  </Accordion>

  <Accordion title="Як установити beta-версію і яка різниця між beta та dev?">
    **Beta** — це npm dist-tag `beta` (може збігатися з `latest` після просування).
    **Dev** — це рухома верхівка `main` (git); після публікації вона використовує npm dist-tag `dev`.

    Однорядкові команди (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Інсталятор Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Докладніше: [Канали розробки](/uk/install/development-channels) і [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Як спробувати найновіші зміни?">
    Є два варіанти:

    1. **Dev-канал (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Це перемикає на гілку `main` і оновлює з вихідного коду.

    2. **Встановлення для редагування (із сайту інсталятора):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це дає локальний репозиторій, який можна редагувати, а потім оновлювати через git.

    Якщо ви віддаєте перевагу чистому клонуванню вручну, використайте:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Документація: [Оновлення](/uk/cli/update), [Канали розробки](/uk/install/development-channels),
    [Встановлення](/uk/install).

  </Accordion>

  <Accordion title="Скільки зазвичай тривають встановлення та онбординг?">
    Орієнтовно:

    - **Встановлення:** 2-5 хвилин
    - **Онбординг QuickStart:** зазвичай кілька хвилин
    - **Повний онбординг:** довше, коли вхід до провайдера, сполучення каналу, встановлення демона,
      мережеві завантаження, Skills або додаткові plugins потребують додаткового налаштування

    Майстер CLI показує цей розклад на початку. Ви можете пропустити необов'язкові кроки й повернутися
    до них пізніше за допомогою `openclaw configure`.

    Якщо процес зависає, скористайтеся [Інсталятор завис](#quick-start-and-first-run-setup)
    і швидким циклом налагодження в [Я застряг](/uk#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Інсталятор завис? Як отримати більше зворотного зв'язку?">
    Запустіть інсталятор повторно з **докладним виводом**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Встановлення beta з докладним виводом:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Для встановлення з можливістю редагування (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Еквівалент для Windows (PowerShell):

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Більше параметрів: [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Встановлення Windows повідомляє, що git не знайдено або openclaw не розпізнано">
    Дві поширені проблеми Windows:

    **1) Помилка npm spawn git / git не знайдено**

    - Установіть **Git for Windows** і переконайтеся, що `git` є у вашому PATH.
    - Закрийте й знову відкрийте PowerShell, а потім повторно запустіть інсталятор.

    **2) openclaw не розпізнається після встановлення**

    - Глобальна папка npm bin не входить до PATH.
    - Перевірте шлях:

      ```powershell
      npm config get prefix
      ```

    - Додайте цей каталог до користувацького PATH (суфікс `\bin` у Windows не потрібен; на більшості систем це `%AppData%\npm`).
    - Закрийте й знову відкрийте PowerShell після оновлення PATH.

    Для налаштування робочого столу використовуйте нативний застосунок **Windows Hub**. Для налаштування
    лише через термінал підтримуються і інсталятор PowerShell, і шляхи WSL2 Gateway.
    Документація: [Windows](/uk/platforms/windows).

  </Accordion>

  <Accordion title="Вивід exec у Windows показує спотворений китайський текст — що робити?">
    Зазвичай це невідповідність кодової сторінки консолі в нативних оболонках Windows.

    Симптоми:

    - Вивід `system.run`/`exec` відображає китайську як mojibake
    - Та сама команда виглядає нормально в іншому профілі термінала

    Швидкий обхідний шлях у PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Потім перезапустіть Gateway і повторіть команду:

    ```powershell
    openclaw gateway restart
    ```

    Якщо це все ще відтворюється в найновішому OpenClaw, відстежуйте або повідомте про це тут:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Документація не відповіла на моє запитання — як отримати кращу відповідь?">
    Використайте **встановлення для редагування (git)**, щоб мати весь вихідний код і документацію локально, а потім запитайте
    свого бота (або Claude/Codex) _з цієї папки_, щоб він міг прочитати репозиторій і відповісти точно.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Докладніше: [Встановлення](/uk/install) і [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Як установити OpenClaw на Linux?">
    Коротка відповідь: дотримуйтеся посібника для Linux, а потім запустіть онбординг.

    - Швидкий шлях Linux + встановлення служби: [Linux](/uk/platforms/linux).
    - Повний покроковий посібник: [Початок роботи](/uk/start/getting-started).
    - Інсталятор + оновлення: [Встановлення й оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Як установити OpenClaw на VPS?">
    Підійде будь-який Linux VPS. Установіть на сервері, а потім використовуйте SSH/Tailscale для доступу до Gateway.

    Посібники: [exe.dev](/uk/install/exe-dev), [Hetzner](/uk/install/hetzner), [Fly.io](/uk/install/fly).
    Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де посібники зі встановлення у хмарі/VPS?">
    Ми підтримуємо **хаб хостингу** з поширеними провайдерами. Виберіть один і дотримуйтеся посібника:

    - [VPS-хостинг](/uk/vps) (усі провайдери в одному місці)
    - [Fly.io](/uk/install/fly)
    - [Hetzner](/uk/install/hetzner)
    - [exe.dev](/uk/install/exe-dev)

    Як це працює у хмарі: **Gateway працює на сервері**, а ви отримуєте доступ до нього
    з ноутбука/телефона через Control UI (або Tailscale/SSH). Ваш стан + робочий простір
    зберігаються на сервері, тож вважайте хост джерелом істини й створюйте його резервні копії.

    Ви можете сполучати **вузли** (Mac/iOS/Android/headless) із цим хмарним Gateway, щоб отримувати доступ
    до локального екрана/камери/canvas або запускати команди на своєму ноутбуці, залишаючи
    Gateway у хмарі.

    Хаб: [Платформи](/uk/platforms). Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).
    Вузли: [Вузли](/uk/nodes), [CLI вузлів](/uk/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я попросити OpenClaw оновити себе?">
    Коротка відповідь: **можливо, але не рекомендовано**. Потік оновлення може перезапустити
    Gateway (що розриває активний сеанс), може потребувати чистого git checkout і
    може запитати підтвердження. Безпечніше: запускати оновлення з оболонки як оператор.

    Використовуйте CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Якщо потрібно автоматизувати з агента:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Документація: [Оновлення](/uk/cli/update), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Що насправді робить онбординг?">
    `openclaw onboard` — рекомендований шлях налаштування. У **локальному режимі** він проводить вас через:

    - **Налаштування моделі/автентифікації** (OAuth провайдера, API-ключі, setup-token Anthropic, а також локальні варіанти моделей, як-от LM Studio)
    - Розташування **робочого простору** + bootstrap-файли
    - **Налаштування Gateway** (bind/port/auth/tailscale)
    - **Канали** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, а також bundled channel plugins на кшталт QQ Bot)
    - **Встановлення демона** (LaunchAgent на macOS; systemd user unit на Linux/WSL2)
    - **Перевірки стану** і вибір **skills**

    Він також задає очікування щодо тривалості до початку основних запитів і попереджає, якщо ваша
    налаштована модель невідома або не має автентифікації.

  </Accordion>

  <Accordion title="Чи потрібна підписка Claude або OpenAI, щоб це запустити?">
    Ні. Ви можете запускати OpenClaw з **API-ключами** (Anthropic/OpenAI/інші) або з
    **моделями лише локально**, щоб ваші дані залишалися на вашому пристрої. Підписки (Claude
    Pro/Max або OpenAI Codex) — необов'язкові способи автентифікації в цих провайдерів.

    Для Anthropic в OpenClaw практичний поділ такий:

    - **API-ключ Anthropic**: звичайний білінг Anthropic API
    - **Claude CLI / автентифікація підписки Claude в OpenClaw**: співробітники Anthropic
      повідомили нам, що таке використання знову дозволене, і OpenClaw вважає використання `claude -p`
      дозволеним для цієї інтеграції, доки Anthropic не опублікує нову
      політику

    Для довготривалих хостів Gateway API-ключі Anthropic усе ще є
    передбачуванішим налаштуванням. OpenAI Codex OAuth явно підтримується для зовнішніх
    інструментів на кшталт OpenClaw.

    OpenClaw також підтримує інші розміщені варіанти у стилі підписки, зокрема
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** і
    **Z.AI / GLM Coding Plan**.

    Документація: [Anthropic](/uk/providers/anthropic), [OpenAI](/uk/providers/openai),
    [Qwen Cloud](/uk/providers/qwen),
    [MiniMax](/uk/providers/minimax), [Z.AI (GLM)](/uk/providers/zai),
    [Локальні моделі](/uk/gateway/local-models), [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Чи можу я використовувати підписку Claude Max без API-ключа?">
    Так.

    Співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому
    OpenClaw вважає автентифікацію підписки Claude і використання `claude -p` дозволеними
    для цієї інтеграції, доки Anthropic не опублікує нову політику. Якщо вам потрібне
    найпередбачуваніше серверне налаштування, натомість використовуйте API-ключ Anthropic.

  </Accordion>

  <Accordion title="Чи підтримуєте ви автентифікацію підписки Claude (Claude Pro або Max)?">
    Так.

    Співробітники Anthropic повідомили нам, що таке використання знову дозволене, тому OpenClaw вважає
    повторне використання Claude CLI і використання `claude -p` дозволеними для цієї інтеграції
    доки Anthropic не опублікує нову політику.

    setup-token Anthropic усе ще доступний як підтримуваний шлях токена OpenClaw, але OpenClaw тепер віддає перевагу повторному використанню Claude CLI і `claude -p`, коли вони доступні.
    Для production або багатокористувацьких навантажень автентифікація через API-ключ Anthropic усе ще є
    безпечнішим і передбачуванішим вибором. Якщо вам потрібні інші розміщені
    варіанти у стилі підписки в OpenClaw, дивіться [OpenAI](/uk/providers/openai), [Qwen / Model
    Cloud](/uk/providers/qwen), [MiniMax](/uk/providers/minimax) і [GLM
    Models](/uk/providers/zai).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

  <AccordionGroup>
  <Accordion title="Чому я бачу HTTP 429 rate_limit_error від Anthropic?">
    Це означає, що ваш **ліміт квоти/частоти Anthropic** вичерпано для поточного вікна. Якщо ви
    використовуєте **Claude CLI**, дочекайтеся скидання вікна або оновіть свій план. Якщо ви
    використовуєте **API-ключ Anthropic**, перевірте Anthropic Console
    щодо використання/білінгу та підвищте ліміти за потреби.

    Якщо повідомлення саме таке:
    `Extra usage is required for long context requests`, запит намагається використати
    контекстне вікно Anthropic 1M (модель Claude 4.x із підтримкою GA для 1M або застарілу
    конфігурацію `context1m: true`). Це працює лише тоді, коли ваші облікові дані мають право
    на білінг довгого контексту (білінг API-ключа або шлях входу OpenClaw Claude
    з увімкненим Extra Usage).

    Порада: задайте **резервну модель**, щоб OpenClaw міг продовжувати відповідати, коли провайдер має обмеження частоти.
    Див. [Моделі](/uk/cli/models), [OAuth](/uk/concepts/oauth) і
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/uk/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Чи підтримується AWS Bedrock?">
    Так. OpenClaw має вбудований провайдер **Amazon Bedrock (Converse)**. За наявності AWS env markers OpenClaw може автоматично виявити streaming/text каталог Bedrock і об’єднати його як неявного провайдера `amazon-bedrock`; інакше ви можете явно ввімкнути `plugins.entries.amazon-bedrock.config.discovery.enabled` або додати запис провайдера вручну. Див. [Amazon Bedrock](/uk/providers/bedrock) і [Провайдери моделей](/uk/providers/models). Якщо ви віддаєте перевагу керованому потоку ключів, OpenAI-сумісний проксі перед Bedrock також залишається допустимим варіантом.
  </Accordion>

  <Accordion title="Як працює автентифікація Codex?">
    OpenClaw підтримує **OpenAI Code (Codex)** через OAuth (вхід ChatGPT). Використовуйте
    `openai/gpt-5.5` для типової конфігурації: автентифікація підписки ChatGPT/Codex плюс
    нативне виконання через Codex app-server. Застарілі посилання Codex GPT — це
    застаріла конфігурація, яку виправляє `openclaw doctor --fix`. Прямий доступ
    через API-ключ OpenAI залишається доступним для неагентських поверхонь OpenAI API та для агентських
    моделей через упорядкований профіль API-ключа `openai`.
    Див. [Провайдери моделей](/uk/concepts/model-providers) і [Онбординг (CLI)](/uk/start/wizard).
  </Accordion>

  <Accordion title="Чому OpenClaw досі згадує застарілий префікс OpenAI Codex?">
    `openai` — це ідентифікатор провайдера й профілю автентифікації як для API-ключів OpenAI, так і для
    OAuth ChatGPT/Codex. Ви все ще можете бачити застарілий префікс OpenAI Codex у застарілій конфігурації та
    попередженнях міграції.
    Старіші конфігурації також використовували його як префікс моделі:

    - `openai/gpt-5.5` = автентифікація підписки ChatGPT/Codex із нативним середовищем Codex для агентських звернень
    - застаріле посилання Codex GPT-5.5 = застарілий маршрут моделі, який виправляє `openclaw doctor --fix`
    - `openai/gpt-5.5` плюс упорядкований профіль API-ключа `openai` = автентифікація API-ключем для агентської моделі OpenAI
    - застарілі ідентифікатори профілів автентифікації Codex = застарілий ідентифікатор профілю автентифікації, який мігрує `openclaw doctor --fix`

    Якщо вам потрібен прямий шлях білінгу/лімітів OpenAI Platform, задайте
    `OPENAI_API_KEY`. Якщо вам потрібна автентифікація підписки ChatGPT/Codex, увійдіть через
    `openclaw models auth login --provider openai`. Залиште посилання на модель як
    `openai/gpt-5.5`; застарілі посилання на моделі Codex — це застаріла конфігурація, яку
    `openclaw doctor --fix` переписує.

  </Accordion>

  <Accordion title="Чому ліміти Codex OAuth можуть відрізнятися від ChatGPT web?">
    Codex OAuth використовує керовані OpenAI вікна квот, що залежать від плану. На практиці
    ці ліміти можуть відрізнятися від досвіду на вебсайті/в застосунку ChatGPT, навіть коли
    обидва прив’язані до того самого облікового запису.

    OpenClaw може показувати поточно видимі вікна використання/квоти провайдера в
    `openclaw models status`, але він не вигадує і не нормалізує права ChatGPT-web
    у прямий доступ до API. Якщо вам потрібен прямий шлях білінгу/лімітів OpenAI Platform,
    використовуйте `openai/*` з API-ключем.

  </Accordion>

  <Accordion title="Чи підтримуєте ви автентифікацію підписки OpenAI (Codex OAuth)?">
    Так. OpenClaw повністю підтримує **OAuth підписки OpenAI Code (Codex)**.
    OpenAI явно дозволяє використання OAuth підписки у зовнішніх інструментах/робочих процесах,
    таких як OpenClaw. Онбординг може виконати потік OAuth за вас.

    Див. [OAuth](/uk/concepts/oauth), [Провайдери моделей](/uk/concepts/model-providers) і [Онбординг (CLI)](/uk/start/wizard).

  </Accordion>

  <Accordion title="Як налаштувати Gemini CLI OAuth?">
    Gemini CLI використовує **потік автентифікації Plugin**, а не client id чи secret у `openclaw.json`.

    Кроки:

    1. Установіть Gemini CLI локально, щоб `gemini` був у `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Увімкніть Plugin: `openclaw plugins enable google`
    3. Увійдіть: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Модель за замовчуванням після входу: `google-gemini-cli/gemini-3-flash-preview`
    5. Якщо запити не вдаються, задайте `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості Gateway

    Це зберігає токени OAuth у профілях автентифікації на хості Gateway. Докладніше: [Провайдери моделей](/uk/concepts/model-providers).

  </Accordion>

  <Accordion title="Чи підходить локальна модель для звичайних чатів?">
    Зазвичай ні. OpenClaw потребує великого контексту й сильної безпеки; малі карти обрізають дані та допускають витоки. Якщо мусите, запускайте **найбільшу** збірку моделі, яку можете локально (LM Studio), і див. [/gateway/local-models](/uk/gateway/local-models). Менші/квантовані моделі підвищують ризик prompt-injection — див. [Безпека](/uk/gateway/security).
  </Accordion>

  <Accordion title="Як утримувати трафік розміщеної моделі в конкретному регіоні?">
    Оберіть прив’язані до регіону кінцеві точки. OpenRouter надає варіанти, розміщені в США, для MiniMax, Kimi та GLM; оберіть варіант, розміщений у США, щоб зберігати дані в регіоні. Ви все ще можете перелічити Anthropic/OpenAI поруч із ними, використовуючи `models.mode: "merge"`, щоб резервні варіанти залишалися доступними з повагою до вибраного регіонального провайдера.
  </Accordion>

  <Accordion title="Чи потрібно купувати Mac Mini, щоб це встановити?">
    Ні. OpenClaw працює на macOS або Linux (Windows через WSL2). Mac mini необов’язковий — деякі люди
    купують його як постійно ввімкнений хост, але невеликий VPS, домашній сервер або пристрій класу Raspberry Pi також підійде.

    Mac потрібен лише **для інструментів, доступних тільки на macOS**. Для iMessage використовуйте [iMessage](/uk/channels/imessage) з `imsg` на будь-якому Mac, де виконано вхід у Messages. Якщо Gateway працює на Linux або деінде, задайте `channels.imessage.cliPath` як SSH-обгортку, що запускає `imsg` на цьому Mac. Якщо вам потрібні інші інструменти, доступні тільки на macOS, запускайте Gateway на Mac або під’єднайте вузол macOS.

    Документація: [iMessage](/uk/channels/imessage), [Вузли](/uk/nodes), [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи потрібен Mac mini для підтримки iMessage?">
    Вам потрібен **будь-який пристрій macOS**, на якому виконано вхід у Messages. Це **не** обов’язково має бути Mac mini —
    підійде будь-який Mac. **Використовуйте [iMessage](/uk/channels/imessage)** з `imsg`; Gateway може працювати на цьому Mac або працювати деінде з SSH-обгорткою `cliPath`.

    Типові конфігурації:

    - Запустіть Gateway на Linux/VPS і задайте `channels.imessage.cliPath` як SSH-обгортку, що запускає `imsg` на Mac, де виконано вхід у Messages.
    - Запустіть усе на Mac, якщо хочете найпростішу конфігурацію на одному комп’ютері.

    Документація: [iMessage](/uk/channels/imessage), [Вузли](/uk/nodes),
    [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Якщо я куплю Mac mini для запуску OpenClaw, чи можу під’єднати його до свого MacBook Pro?">
    Так. **Mac mini може запускати Gateway**, а ваш MacBook Pro може під’єднатися як
    **вузол** (супровідний пристрій). Вузли не запускають Gateway — вони надають додаткові
    можливості, як-от екран/камера/canvas і `system.run` на цьому пристрої.

    Типовий шаблон:

    - Gateway на Mac mini (постійно ввімкнений).
    - MacBook Pro запускає застосунок macOS або хост вузла й сполучається з Gateway.
    - Використовуйте `openclaw nodes status` / `openclaw nodes list`, щоб побачити його.

    Документація: [Вузли](/uk/nodes), [CLI вузлів](/uk/cli/nodes).

  </Accordion>

  <Accordion title="Чи можна використовувати Bun?">
    Bun **не рекомендовано**. Ми бачимо помилки виконання, особливо з WhatsApp і Telegram.
    Використовуйте **Node** для стабільних Gateway.

    Якщо ви все ж хочете поекспериментувати з Bun, робіть це на не production Gateway
    без WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: що вказувати в allowFrom?">
    `channels.telegram.allowFrom` — це **Telegram user ID людини-відправника** (числовий). Це не ім’я користувача бота.

    Налаштування просить лише числові ідентифікатори користувачів. Якщо у вас уже є застарілі записи `@username` у конфігурації, `openclaw doctor --fix` може спробувати їх розв’язати.

    Безпечніше (без стороннього бота):

    - Надішліть DM своєму боту, потім виконайте `openclaw logs --follow` і прочитайте `from.id`.

    Офіційний Bot API:

    - Надішліть DM своєму боту, потім викличте `https://api.telegram.org/bot<bot_token>/getUpdates` і прочитайте `message.from.id`.

    Сторонні варіанти (менш приватно):

    - Надішліть DM `@userinfobot` або `@getidsbot`.

    Див. [/channels/telegram](/uk/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Чи можуть кілька людей використовувати один номер WhatsApp із різними екземплярами OpenClaw?">
    Так, через **багатоагентну маршрутизацію**. Прив’яжіть **DM** WhatsApp кожного відправника (peer `kind: "direct"`, відправник E.164 на кшталт `+15551234567`) до іншого `agentId`, щоб кожна людина отримала власний робочий простір і сховище сеансів. Відповіді все одно надходитимуть з **того самого облікового запису WhatsApp**, а контроль доступу DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) є глобальним для облікового запису WhatsApp. Див. [Багатоагентна маршрутизація](/uk/concepts/multi-agent) і [WhatsApp](/uk/channels/whatsapp).
  </Accordion>

  <Accordion title='Чи можу я запустити агента "швидкого чату" й агента "Opus для кодування"?'>
    Так. Використовуйте багатоагентну маршрутизацію: задайте кожному агенту власну модель за замовчуванням, а потім прив’яжіть вхідні маршрути (обліковий запис провайдера або конкретних peer) до кожного агента. Приклад конфігурації є в [Багатоагентна маршрутизація](/uk/concepts/multi-agent). Див. також [Моделі](/uk/concepts/models) і [Конфігурація](/uk/gateway/configuration).
  </Accordion>

  <Accordion title="Чи працює Homebrew на Linux?">
    Так. Homebrew підтримує Linux (Linuxbrew). Швидке налаштування:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Якщо ви запускаєте OpenClaw через systemd, переконайтеся, що PATH сервісу містить `/home/linuxbrew/.linuxbrew/bin` (або ваш префікс brew), щоб інструменти, встановлені через `brew`, розв’язувалися в non-login shells.
    Останні збірки також додають на початок поширені користувацькі bin-каталоги в Linux systemd services (наприклад `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) і враховують `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` і `FNM_DIR`, коли їх задано.

  </Accordion>

  <Accordion title="Різниця між hackable git install і npm install">
    - **Hackable (git) install:** повний checkout вихідного коду, придатний до редагування, найкращий для контриб’юторів.
      Ви запускаєте збірки локально й можете вносити виправлення в код/документацію.
    - **npm install:** глобальне встановлення CLI, без репозиторію, найкраще для сценарію "просто запустити".
      Оновлення надходять з npm dist-tags.

    Документація: [Початок роботи](/uk/start/getting-started), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Чи можу я пізніше перемикатися між npm і git install?">
    Так. Використовуйте `openclaw update --channel ...`, коли OpenClaw уже встановлено.
    Це **не видаляє ваші дані** — це лише змінює інсталяцію коду OpenClaw.
    Ваш стан (`~/.openclaw`) і робочий простір (`~/.openclaw/workspace`) залишаються недоторканими.

    З npm на git:

    ```bash
    openclaw update --channel dev
    ```

    З git на npm:

    ```bash
    openclaw update --channel stable
    ```

    Додайте `--dry-run`, щоб спочатку переглянути заплановане перемикання режиму. Оновлювач виконує
    подальші дії Doctor, оновлює джерела plugin для цільового каналу та
    перезапускає Gateway, якщо ви не передали `--no-restart`.

    Інсталятор також може примусово вибрати будь-який режим:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Поради щодо резервних копій: див. [Стратегія резервного копіювання](/uk/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Чи слід запускати Gateway на моєму ноутбуці чи на VPS?">
    Коротка відповідь: **якщо вам потрібна надійність 24/7, використовуйте VPS**. Якщо вам потрібен
    мінімум тертя і вас влаштовують сон/перезапуски, запускайте його локально.

    **Ноутбук (локальний Gateway)**

    - **Переваги:** немає витрат на сервер, прямий доступ до локальних файлів, живе вікно браузера.
    - **Недоліки:** сон/збої мережі = роз'єднання, оновлення ОС/перезавантаження переривають роботу, має залишатися активним.

    **VPS / хмара**

    - **Переваги:** завжди ввімкнений, стабільна мережа, немає проблем зі сном ноутбука, легше підтримувати роботу.
    - **Недоліки:** часто працює без екрана (використовуйте знімки екрана), лише віддалений доступ до файлів, для оновлень потрібен SSH.

    **Примітка щодо OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord усі нормально працюють із VPS. Єдиний справжній компроміс — **безголовий браузер** проти видимого вікна. Див. [Браузер](/uk/tools/browser).

    **Рекомендовано за замовчуванням:** VPS, якщо раніше у вас були роз'єднання Gateway. Локальний запуск чудово підходить, коли ви активно користуєтеся Mac і хочете мати доступ до локальних файлів або автоматизацію UI з видимим браузером.

  </Accordion>

  <Accordion title="Наскільки важливо запускати OpenClaw на виділеній машині?">
    Це не обов'язково, але **рекомендовано для надійності й ізоляції**.

    - **Виділений хост (VPS/Mac mini/Raspberry Pi):** завжди ввімкнений, менше переривань через сон/перезавантаження, чистіші дозволи, легше підтримувати роботу.
    - **Спільний ноутбук/настільний комп'ютер:** цілком підходить для тестування й активного використання, але очікуйте пауз, коли машина засинає або оновлюється.

    Якщо вам потрібне найкраще з обох світів, тримайте Gateway на виділеному хості та під'єднайте свій ноутбук як **вузол** для локальних інструментів екрана/камери/exec. Див. [Вузли](/uk/nodes).
    Рекомендації з безпеки див. у [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які мінімальні вимоги до VPS і рекомендована ОС?">
    OpenClaw легкий. Для базового Gateway + одного чат-каналу:

    - **Абсолютний мінімум:** 1 vCPU, 1GB RAM, ~500MB диска.
    - **Рекомендовано:** 1-2 vCPU, 2GB RAM або більше для запасу (логи, медіа, кілька каналів). Інструменти Node й автоматизація браузера можуть потребувати багато ресурсів.

    ОС: використовуйте **Ubuntu LTS** (або будь-який сучасний Debian/Ubuntu). Шлях встановлення Linux найкраще протестований там.

    Документація: [Linux](/uk/platforms/linux), [Хостинг VPS](/uk/vps).

  </Accordion>

  <Accordion title="Чи можу я запускати OpenClaw у VM і які вимоги?">
    Так. Ставтеся до VM так само, як до VPS: вона має бути завжди ввімкнена, доступна та мати достатньо
    RAM для Gateway і будь-яких каналів, які ви ввімкнете.

    Базові рекомендації:

    - **Абсолютний мінімум:** 1 vCPU, 1GB RAM.
    - **Рекомендовано:** 2GB RAM або більше, якщо ви запускаєте кілька каналів, автоматизацію браузера або медіаінструменти.
    - **ОС:** Ubuntu LTS або інший сучасний Debian/Ubuntu.

    Якщо ви на Windows, використовуйте **Windows Hub** для налаштування робочого столу або WSL2, коли
    вам конкретно потрібна VM Gateway у стилі Linux із широкою сумісністю
    інструментів. Див. [Windows](/uk/platforms/windows), [Хостинг VPS](/uk/vps).
    Якщо ви запускаєте macOS у VM, див. [macOS VM](/uk/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Пов'язане

- [FAQ](/uk/help/faq) — основний FAQ (моделі, сесії, gateway, безпека тощо)
- [Огляд встановлення](/uk/install)
- [Початок роботи](/uk/start/getting-started)
- [Усунення несправностей](/uk/help/troubleshooting)
