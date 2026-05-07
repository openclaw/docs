---
read_when:
    - Нове встановлення, зависання під час первинного налаштування або помилки першого запуску
    - Вибір автентифікації та підписок провайдера
    - Не вдається отримати доступ до docs.openclaw.ai, не вдається відкрити панель керування, встановлення зависло
sidebarTitle: First-run FAQ
summary: 'Поширені запитання: швидкий старт і налаштування під час першого запуску — встановлення, онбординг, автентифікація, підписки, початкові збої'
title: 'Поширені запитання: налаштування під час першого запуску'
x-i18n:
    generated_at: "2026-05-07T13:19:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 347a09ebdbdf564389b406de3d5d47d097ead33d33eed4a68880bfbcaf82e048
    source_path: help/faq-first-run.md
    workflow: 16
---

  Швидкий старт і питання-відповіді для першого запуску. Для повсякденних операцій, моделей, авторизації, сеансів
  і усунення несправностей див. основний [FAQ](/uk/help/faq).

  ## Швидкий старт і налаштування першого запуску

  <AccordionGroup>
  <Accordion title="Я застряг, найшвидший спосіб розблокуватися">
    Використовуйте локального AI агента, який може **бачити вашу машину**. Це значно ефективніше, ніж питати
    в Discord, бо більшість випадків "я застряг" - це **проблеми локальної конфігурації або середовища**, які
    віддалені помічники не можуть перевірити.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Ці інструменти можуть читати репозиторій, запускати команди, перевіряти журнали й допомагати виправляти налаштування
    на рівні вашої машини (PATH, служби, дозволи, файли авторизації). Надайте їм **повний checkout вихідного коду** через
    hackable (git) встановлення:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це встановлює OpenClaw **з git checkout**, тому агент може читати код + документацію й
    міркувати про точну версію, яку ви запускаєте. Пізніше ви завжди можете повернутися до стабільної версії,
    повторно запустивши інсталятор без `--install-method git`.

    Порада: попросіть агента **спланувати й супроводжувати** виправлення (крок за кроком), а потім виконувати лише
    необхідні команди. Так зміни будуть меншими й простішими для аудиту.

    Якщо ви виявили справжню помилку або виправлення, створіть GitHub issue або надішліть PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Почніть із цих команд (надавайте вивід, коли просите про допомогу):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Що вони роблять:

    - `openclaw status`: швидкий знімок стану gateway/агента + базова конфігурація.
    - `openclaw models status`: перевіряє авторизацію провайдера + доступність моделей.
    - `openclaw doctor`: перевіряє та виправляє поширені проблеми конфігурації/стану.

    Інші корисні перевірки CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Швидкий цикл налагодження: [Перші 60 секунд, якщо щось зламано](/uk/help/faq#first-60-seconds-if-something-is-broken).
    Документація зі встановлення: [Встановлення](/uk/install), [Прапорці інсталятора](/uk/install/installer), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Heartbeat постійно пропускається. Що означають причини пропуску?">
    Поширені причини пропуску heartbeat:

    - `quiet-hours`: поза налаштованим вікном активних годин
    - `empty-heartbeat-file`: `HEARTBEAT.md` існує, але містить лише порожній/тільки заголовковий каркас
    - `no-tasks-due`: режим завдань `HEARTBEAT.md` активний, але жоден з інтервалів завдань ще не настав
    - `alerts-disabled`: усю видимість heartbeat вимкнено (`showOk`, `showAlerts` і `useIndicator` вимкнені)

    У режимі завдань часові позначки настання оновлюються лише після завершення
    справжнього запуску heartbeat. Пропущені запуски не позначають завдання як виконані.

    Документація: [Heartbeat](/uk/gateway/heartbeat), [Автоматизація і завдання](/uk/automation).

  </Accordion>

  <Accordion title="Рекомендований спосіб встановлення й налаштування OpenClaw">
    Репозиторій рекомендує запуск із вихідного коду та використання onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Майстер також може автоматично збирати UI assets. Після onboarding ви зазвичай запускаєте Gateway на порту **18789**.

    З вихідного коду (контриб'ютори/розробка):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Якщо у вас ще немає глобального встановлення, запустіть його через `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Як відкрити dashboard після onboarding?">
    Майстер відкриває ваш браузер із чистою (без токенізації) URL-адресою dashboard одразу після onboarding, а також друкує посилання в підсумку. Тримайте цю вкладку відкритою; якщо вона не запустилася, скопіюйте/вставте надруковану URL-адресу на тій самій машині.
  </Accordion>

  <Accordion title="Як авторизувати dashboard на localhost порівняно з віддаленим доступом?">
    **Localhost (та сама машина):**

    - Відкрийте `http://127.0.0.1:18789/`.
    - Якщо він просить авторизацію shared-secret, вставте налаштований токен або пароль у налаштування Control UI.
    - Джерело токена: `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`).
    - Джерело пароля: `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо shared secret ще не налаштовано, згенеруйте токен за допомогою `openclaw doctor --generate-gateway-token`.

    **Не на localhost:**

    - **Tailscale Serve** (рекомендовано): залиште bind loopback, запустіть `openclaw gateway --tailscale serve`, відкрийте `https://<magicdns>/`. Якщо `gateway.auth.allowTailscale` має значення `true`, заголовки ідентичності задовольняють авторизацію Control UI/WebSocket (без вставленого shared secret, припускається довірений хост gateway); HTTP API все одно потребують авторизації shared-secret, якщо ви навмисно не використовуєте private-ingress `none` або HTTP-авторизацію trusted-proxy.
      Невдалі одночасні спроби авторизації Serve з того самого клієнта серіалізуються до того, як failed-auth limiter їх записує, тому друга невдала повторна спроба вже може показати `retry later`.
    - **Tailnet bind**: запустіть `openclaw gateway --bind tailnet --token "<token>"` (або налаштуйте авторизацію паролем), відкрийте `http://<tailscale-ip>:18789/`, а потім вставте відповідний shared secret у налаштування dashboard.
    - **Identity-aware reverse proxy**: тримайте Gateway за довіреним proxy, налаштуйте `gateway.auth.mode: "trusted-proxy"`, а потім відкрийте URL proxy. Same-host loopback proxy потребують явного `gateway.auth.trustedProxy.allowLoopback = true`.
    - **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, потім відкрийте `http://127.0.0.1:18789/`. Авторизація shared-secret усе одно застосовується через tunnel; вставте налаштований токен або пароль, якщо буде запит.

    Див. [Dashboard](/uk/web/dashboard) і [Вебповерхні](/uk/web) для режимів bind і деталей авторизації.

  </Accordion>

  <Accordion title="Чому є дві конфігурації exec approval для chat approvals?">
    Вони керують різними рівнями:

    - `approvals.exec`: пересилає approval prompts до chat destinations
    - `channels.<channel>.execApprovals`: змушує цей channel діяти як native approval client для exec approvals

    Політика host exec усе одно є справжнім approval gate. Chat config лише керує тим, де
    з'являються approval prompts і як люди можуть на них відповідати.

    У більшості налаштувань вам **не** потрібні обидві:

    - Якщо chat уже підтримує команди й відповіді, `/approve` у тому самому chat працює через спільний шлях.
    - Якщо підтримуваний native channel може безпечно визначати approvers, OpenClaw тепер автоматично вмикає DM-first native approvals, коли `channels.<channel>.execApprovals.enabled` не задано або має значення `"auto"`.
    - Коли доступні native approval cards/buttons, цей native UI є основним шляхом; агент має додавати ручну команду `/approve` лише якщо результат інструмента каже, що chat approvals недоступні або manual approval є єдиним шляхом.
    - Використовуйте `approvals.exec` лише коли prompts також потрібно пересилати до інших chats або явних ops rooms.
    - Використовуйте `channels.<channel>.execApprovals.target: "channel"` або `"both"` лише коли ви явно хочете, щоб approval prompts публікувалися назад у початкову room/topic.
    - Plugin approvals знову окремі: вони типово використовують `/approve` у тому самому chat, необов'язкове пересилання `approvals.plugin`, і лише деякі native channels додатково зберігають plugin-approval-native handling.

    Коротко: forwarding потрібен для маршрутизації, native client config - для багатшого channel-specific UX.
    Див. [Exec Approvals](/uk/tools/exec-approvals).

  </Accordion>

  <Accordion title="Який runtime потрібен?">
    Потрібен Node **>= 22**. Рекомендовано `pnpm`. Bun **не рекомендовано** для Gateway.
  </Accordion>

  <Accordion title="Чи працює це на Raspberry Pi?">
    Так. Gateway легкий - документація вказує **512MB-1GB RAM**, **1 core** і приблизно **500MB**
    диска як достатні для особистого використання, а також зазначає, що **Raspberry Pi 4 може його запускати**.

    Якщо ви хочете додатковий запас (журнали, медіа, інші служби), **рекомендовано 2GB**, але це
    не жорсткий мінімум.

    Порада: маленький Pi/VPS може розміщувати Gateway, а ви можете під'єднувати **nodes** на своєму ноутбуці/телефоні для
    локального екрана/камери/canvas або виконання команд. Див. [Nodes](/uk/nodes).

  </Accordion>

  <Accordion title="Є поради для встановлення на Raspberry Pi?">
    Коротко: працює, але очікуйте шорсткостей.

    - Використовуйте **64-bit** OS і тримайте Node >= 22.
    - Віддавайте перевагу **hackable (git) install**, щоб бачити журнали й швидко оновлюватися.
    - Почніть без channels/Skills, потім додавайте їх по одному.
    - Якщо натрапите на дивні проблеми з binary, це зазвичай проблема **ARM compatibility**.

    Документація: [Linux](/uk/platforms/linux), [Встановлення](/uk/install).

  </Accordion>

  <Accordion title="Він застряг на wake up my friend / onboarding не вилуплюється. Що тепер?">
    Цей екран залежить від того, чи Gateway доступний і авторизований. TUI також автоматично надсилає
    "Wake up, my friend!" під час першого hatch. Якщо ви бачите цей рядок **без відповіді**,
    а tokens залишаються на 0, агент ніколи не запускався.

    1. Перезапустіть Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Перевірте статус + авторизацію:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Якщо він усе ще зависає, запустіть:

    ```bash
    openclaw doctor
    ```

    Якщо Gateway віддалений, переконайтеся, що tunnel/Tailscale connection активне і що UI
    вказує на правильний Gateway. Див. [Віддалений доступ](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Чи можу я перенести своє налаштування на нову машину (Mac mini), не проходячи onboarding заново?">
    Так. Скопіюйте **state directory** і **workspace**, потім один раз запустіть Doctor. Це
    збереже вашого бота "точно таким самим" (memory, session history, auth і channel
    state), якщо ви скопіюєте **обидві** локації:

    1. Встановіть OpenClaw на новій машині.
    2. Скопіюйте `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`) зі старої машини.
    3. Скопіюйте свій workspace (типово: `~/.openclaw/workspace`).
    4. Запустіть `openclaw doctor` і перезапустіть службу Gateway.

    Це зберігає config, auth profiles, WhatsApp creds, sessions і memory. Якщо ви в
    remote mode, пам'ятайте, що gateway host володіє session store і workspace.

    **Важливо:** якщо ви лише commit/push свій workspace до GitHub, ви створюєте резервну копію
    **memory + bootstrap files**, але **не** session history чи auth. Вони живуть
    у `~/.openclaw/` (наприклад `~/.openclaw/agents/<agentId>/sessions/`).

    Пов'язано: [Міграція](/uk/install/migrating), [Де речі зберігаються на диску](/uk/help/faq#where-things-live-on-disk),
    [Agent workspace](/uk/concepts/agent-workspace), [Doctor](/uk/gateway/doctor),
    [Remote mode](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де подивитися, що нового в останній версії?">
    Перевірте GitHub changelog:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Найновіші записи розміщені вгорі. Якщо верхній розділ позначено **Unreleased**, наступний датований
    розділ є останньою випущеною версією. Записи згруповано за **Highlights**, **Changes** і
    **Fixes** (плюс розділи документації/іншого, коли потрібно).

  </Accordion>

  <Accordion title="Не вдається отримати доступ до docs.openclaw.ai (SSL error)">
    Деякі підключення Comcast/Xfinity неправильно блокують `docs.openclaw.ai` через Xfinity
    Advanced Security. Вимкніть це або додайте `docs.openclaw.ai` до allowlist, потім повторіть спробу.
    Допоможіть нам розблокувати це, повідомивши тут: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Якщо ви все ще не можете відкрити сайт, документація дублюється на GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Різниця між stable і beta">
    **Stable** і **beta** - це **npm dist-tags**, а не окремі лінії коду:

    - `latest` = stable
    - `beta` = рання збірка для тестування

    Зазвичай стабільний реліз спершу потрапляє в **beta**, а потім окремий
    крок просування переносить ту саму версію в `latest`. Maintainers також можуть
    публікувати одразу в `latest`, коли це потрібно. Саме тому beta і stable можуть
    вказувати на **ту саму версію** після просування.

    Дивіться, що змінилося:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Однорядкові команди встановлення та різницю між beta і dev дивіться в акордеоні нижче.

  </Accordion>

  <Accordion title="Як встановити beta-версію і яка різниця між beta та dev?">
    **Beta** - це npm dist-tag `beta` (після просування може збігатися з `latest`).
    **Dev** - це рухома вершина `main` (git); під час публікації вона використовує npm dist-tag `dev`.

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
    Два варіанти:

    1. **Канал dev (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Це перемикає на гілку `main` і оновлює з вихідного коду.

    2. **Встановлення з можливістю змін (із сайту інсталятора):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це дає вам локальний репозиторій, який можна редагувати, а потім оновлювати через git.

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
    - **Онбординг:** 5-15 хвилин залежно від того, скільки каналів/моделей ви налаштовуєте

    Якщо процес зависає, скористайтеся [Інсталятор завис](#quick-start-and-first-run-setup)
    і швидким циклом налагодження в [Я застряг](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Інсталятор завис? Як отримати більше зворотного зв’язку?">
    Повторно запустіть інсталятор із **докладним виводом**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Встановлення beta з докладним виводом:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Для встановлення з можливістю змін (git):

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

  <Accordion title="Під час встановлення Windows повідомляє, що git не знайдено або openclaw не розпізнано">
    Дві поширені проблеми Windows:

    **1) npm error spawn git / git not found**

    - Встановіть **Git for Windows** і переконайтеся, що `git` є у вашому PATH.
    - Закрийте й знову відкрийте PowerShell, потім повторно запустіть інсталятор.

    **2) openclaw is not recognized after install**

    - Глобальна папка bin для npm не додана до PATH.
    - Перевірте шлях:

      ```powershell
      npm config get prefix
      ```

    - Додайте цей каталог до свого користувацького PATH (суфікс `\bin` у Windows не потрібен; у більшості систем це `%AppData%\npm`).
    - Після оновлення PATH закрийте й знову відкрийте PowerShell.

    Якщо хочете найзручніше налаштування Windows, використовуйте **WSL2** замість нативної Windows.
    Документація: [Windows](/uk/platforms/windows).

  </Accordion>

  <Accordion title="Вивід exec у Windows показує спотворений китайський текст - що робити?">
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

    Якщо ви все ще відтворюєте це на найновішому OpenClaw, відстежуйте/повідомляйте про це тут:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Документація не відповіла на моє запитання - як отримати кращу відповідь?">
    Використайте **встановлення з можливістю змін (git)**, щоб мати повний вихідний код і документацію локально, а потім запитайте
    свого бота (або Claude/Codex) _з цієї папки_, щоб він міг прочитати репозиторій і відповісти точно.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Докладніше: [Встановлення](/uk/install) і [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Як встановити OpenClaw на Linux?">
    Коротка відповідь: дотримуйтеся посібника для Linux, потім запустіть онбординг.

    - Швидкий шлях для Linux + встановлення служби: [Linux](/uk/platforms/linux).
    - Повний покроковий посібник: [Початок роботи](/uk/start/getting-started).
    - Інсталятор + оновлення: [Встановлення й оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Як встановити OpenClaw на VPS?">
    Підійде будь-який Linux VPS. Встановіть на сервер, потім використовуйте SSH/Tailscale для доступу до Gateway.

    Посібники: [exe.dev](/uk/install/exe-dev), [Hetzner](/uk/install/hetzner), [Fly.io](/uk/install/fly).
    Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де посібники зі встановлення у хмарі/VPS?">
    Ми підтримуємо **хаб хостингу** з поширеними провайдерами. Виберіть один і дотримуйтеся посібника:

    - [VPS-хостинг](/uk/vps) (усі провайдери в одному місці)
    - [Fly.io](/uk/install/fly)
    - [Hetzner](/uk/install/hetzner)
    - [exe.dev](/uk/install/exe-dev)

    Як це працює в хмарі: **Gateway працює на сервері**, а ви отримуєте доступ до нього
    зі свого ноутбука/телефона через Control UI (або Tailscale/SSH). Ваш стан + workspace
    живуть на сервері, тому вважайте хост джерелом істини й створюйте резервні копії.

    Ви можете спарювати **nodes** (Mac/iOS/Android/headless) із цим хмарним Gateway, щоб отримати доступ
    до локального екрана/камери/canvas або запускати команди на своєму ноутбуці, зберігаючи
    Gateway у хмарі.

    Хаб: [Платформи](/uk/platforms). Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).
    Nodes: [Nodes](/uk/nodes), [Nodes CLI](/uk/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я попросити OpenClaw оновити себе?">
    Коротка відповідь: **можливо, але не рекомендовано**. Процес оновлення може перезапустити
    Gateway (що розриває активну сесію), може потребувати чистого git checkout і
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
    `openclaw onboard` - це рекомендований шлях налаштування. У **локальному режимі** він проводить вас через:

    - **Налаштування моделі/автентифікації** (OAuth провайдера, API-ключі, setup-token Anthropic, а також локальні варіанти моделей, як-от LM Studio)
    - Розташування **workspace** + bootstrap-файли
    - **Налаштування Gateway** (bind/port/auth/tailscale)
    - **Канали** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, а також вбудовані channel plugins, як-от QQ Bot)
    - **Встановлення daemon** (LaunchAgent на macOS; systemd user unit на Linux/WSL2)
    - **Перевірки стану** і вибір **skills**

    Він також попереджає, якщо ваша налаштована модель невідома або не має автентифікації.

  </Accordion>

  <Accordion title="Чи потрібна мені підписка Claude або OpenAI, щоб це запустити?">
    Ні. Ви можете запускати OpenClaw з **API-ключами** (Anthropic/OpenAI/інші) або з
    **лише локальними моделями**, щоб ваші дані залишалися на вашому пристрої. Підписки (Claude
    Pro/Max або OpenAI Codex) - це необов’язкові способи автентифікації цих провайдерів.

    Для Anthropic в OpenClaw практичний поділ такий:

    - **API-ключ Anthropic**: звичайна оплата Anthropic API
    - **Claude CLI / автентифікація підписки Claude в OpenClaw**: співробітники Anthropic
      повідомили нам, що таке використання знову дозволене, і OpenClaw вважає використання `claude -p`
      санкціонованим для цієї інтеграції, якщо Anthropic не опублікує нову
      політику

    Для довготривалих хостів gateway API-ключі Anthropic усе ще є більш
    передбачуваним налаштуванням. OpenAI Codex OAuth явно підтримується для зовнішніх
    інструментів, як-от OpenClaw.

    OpenClaw також підтримує інші розміщені варіанти у стилі підписки, зокрема
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** і
    **Z.AI / GLM Coding Plan**.

    Документація: [Anthropic](/uk/providers/anthropic), [OpenAI](/uk/providers/openai),
    [Qwen Cloud](/uk/providers/qwen),
    [MiniMax](/uk/providers/minimax), [GLM Models](/uk/providers/glm),
    [Локальні моделі](/uk/gateway/local-models), [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Чи можу я використовувати підписку Claude Max без API-ключа?">
    Так.

    Співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому
    OpenClaw вважає автентифікацію підписки Claude і використання `claude -p` санкціонованими
    для цієї інтеграції, якщо Anthropic не опублікує нову політику. Якщо вам потрібне
    найпередбачуваніше серверне налаштування, натомість використовуйте API-ключ Anthropic.

  </Accordion>

  <Accordion title="Чи підтримуєте ви автентифікацію підписки Claude (Claude Pro або Max)?">
    Так.

    Співробітники Anthropic повідомили нам, що таке використання знову дозволене, тому OpenClaw вважає
    повторне використання Claude CLI і використання `claude -p` санкціонованими для цієї інтеграції,
    якщо Anthropic не опублікує нову політику.

    Anthropic setup-token усе ще доступний як підтримуваний шлях токена OpenClaw, але OpenClaw тепер віддає перевагу повторному використанню Claude CLI і `claude -p`, коли вони доступні.
    Для production або багатокористувацьких навантажень автентифікація через API-ключ Anthropic усе ще є
    безпечнішим і передбачуванішим вибором. Якщо вам потрібні інші розміщені
    варіанти у стилі підписки в OpenClaw, дивіться [OpenAI](/uk/providers/openai), [Qwen / Model
    Cloud](/uk/providers/qwen), [MiniMax](/uk/providers/minimax) і [GLM
    Models](/uk/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Чому я бачу HTTP 429 rate_limit_error від Anthropic?">
    Це означає, що ваша **квота/ліміт швидкості Anthropic** вичерпана для поточного вікна. Якщо ви
    використовуєте **Claude CLI**, зачекайте скидання вікна або оновіть свій план. Якщо ви
    використовуєте **API-ключ Anthropic**, перевірте Anthropic Console
    щодо використання/білінгу й підвищте ліміти за потреби.

    Якщо повідомлення саме таке:
    `Extra usage is required for long context requests`, запит намагається використати
    бета-версію контексту Anthropic 1M (`context1m: true`). Це працює лише тоді, коли ваші
    облікові дані мають право на тарифікацію довгого контексту (тарифікація API-ключа або
    шлях входу OpenClaw Claude з увімкненим Extra Usage).

    Порада: налаштуйте **резервну модель**, щоб OpenClaw міг продовжувати відповідати, поки постачальник має обмеження частоти.
    Див. [Моделі](/uk/cli/models), [OAuth](/uk/concepts/oauth) і
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/uk/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Чи підтримується AWS Bedrock?">
    Так. OpenClaw має вбудованого постачальника **Amazon Bedrock (Converse)**. За наявності маркерів середовища AWS OpenClaw може автоматично виявити потоковий/текстовий каталог Bedrock і об'єднати його як неявного постачальника `amazon-bedrock`; інакше ви можете явно увімкнути `plugins.entries.amazon-bedrock.config.discovery.enabled` або додати запис постачальника вручну. Див. [Amazon Bedrock](/uk/providers/bedrock) і [Постачальники моделей](/uk/providers/models). Якщо вам зручніший керований потік ключів, OpenAI-сумісний проксі перед Bedrock усе ще є коректним варіантом.
  </Accordion>

  <Accordion title="Як працює автентифікація Codex?">
    OpenClaw підтримує **OpenAI Code (Codex)** через OAuth (вхід ChatGPT). Використовуйте
    `openai/gpt-5.5` з `agentRuntime.id: "codex"` для типової конфігурації:
    автентифікація за підпискою ChatGPT/Codex плюс нативне виконання сервера застосунку Codex. Використовуйте
    `openai-codex/gpt-5.5` лише тоді, коли вам потрібен Codex OAuth через стандартне
    середовище виконання Codex. Прямий доступ за API-ключем OpenAI залишається доступним для неагентних
    поверхонь OpenAI API і для агентних моделей через упорядкований
    профіль API-ключа `openai-codex`.
    Див. [Постачальники моделей](/uk/concepts/model-providers) і [Початкове налаштування (CLI)](/uk/start/wizard).
  </Accordion>

  <Accordion title="Чому OpenClaw досі згадує openai-codex?">
    `openai-codex` — це ідентифікатор постачальника та профілю автентифікації для ChatGPT/Codex OAuth.
    Старіші конфігурації також використовували його як префікс моделі:

    - `openai/gpt-5.5` = автентифікація за підпискою ChatGPT/Codex із нативним середовищем виконання Codex для ходів агента
    - `openai-codex/gpt-5.5` = застарілий маршрут моделі, який виправляє `openclaw doctor --fix`
    - `openai/gpt-5.5` плюс упорядкований профіль API-ключа `openai-codex` = автентифікація API-ключем для агентної моделі OpenAI
    - `openai-codex:...` = ідентифікатор профілю автентифікації, а не посилання на модель

    Якщо вам потрібен прямий шлях тарифікації/лімітів OpenAI Platform, задайте
    `OPENAI_API_KEY`. Якщо вам потрібна автентифікація за підпискою ChatGPT/Codex, увійдіть за допомогою
    `openclaw models auth login --provider openai-codex`. Залишайте посилання на модель як
    `openai/gpt-5.5`; посилання на моделі `openai-codex/*` є застарілою конфігурацією, яку
    `openclaw doctor --fix` переписує.

  </Accordion>

  <Accordion title="Чому ліміти Codex OAuth можуть відрізнятися від вебверсії ChatGPT?">
    Codex OAuth використовує керовані OpenAI, залежні від плану вікна квот. На практиці
    ці ліміти можуть відрізнятися від досвіду на сайті/у застосунку ChatGPT, навіть коли
    обидва прив'язані до того самого облікового запису.

    OpenClaw може показати поточні видимі вікна використання/квот постачальника в
    `openclaw models status`, але він не вигадує і не нормалізує права ChatGPT-web
    у прямий доступ до API. Якщо вам потрібен прямий шлях тарифікації/лімітів OpenAI Platform,
    використовуйте `openai/*` з API-ключем.

  </Accordion>

  <Accordion title="Чи підтримуєте ви автентифікацію за підпискою OpenAI (Codex OAuth)?">
    Так. OpenClaw повністю підтримує **OpenAI Code (Codex) subscription OAuth**.
    OpenAI прямо дозволяє використання subscription OAuth у зовнішніх інструментах/робочих процесах,
    таких як OpenClaw. Початкове налаштування може виконати потік OAuth для вас.

    Див. [OAuth](/uk/concepts/oauth), [Постачальники моделей](/uk/concepts/model-providers) і [Початкове налаштування (CLI)](/uk/start/wizard).

  </Accordion>

  <Accordion title="Як налаштувати Gemini CLI OAuth?">
    Gemini CLI використовує **потік автентифікації Plugin**, а не client id чи secret в `openclaw.json`.

    Кроки:

    1. Установіть Gemini CLI локально, щоб `gemini` був у `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Увімкніть Plugin: `openclaw plugins enable google`
    3. Увійдіть: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Стандартна модель після входу: `google-gemini-cli/gemini-3-flash-preview`
    5. Якщо запити не виконуються, задайте `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості gateway

    Це зберігає токени OAuth у профілях автентифікації на хості gateway. Докладніше: [Постачальники моделей](/uk/concepts/model-providers).

  </Accordion>

  <Accordion title="Чи підходить локальна модель для невимушених чатів?">
    Зазвичай ні. OpenClaw потребує великого контексту та сильної безпеки; малі картки обрізають і допускають витоки. Якщо вам необхідно, запускайте **найбільшу** збірку моделі, яку можете локально (LM Studio), і див. [/gateway/local-models](/uk/gateway/local-models). Менші/квантовані моделі підвищують ризик prompt-injection — див. [Безпека](/uk/gateway/security).
  </Accordion>

  <Accordion title="Як утримувати трафік розміщених моделей у певному регіоні?">
    Вибирайте прив'язані до регіону кінцеві точки. OpenRouter надає розміщені в США варіанти для MiniMax, Kimi та GLM; виберіть варіант, розміщений у США, щоб утримувати дані в регіоні. Ви все ще можете вказати Anthropic/OpenAI поруч із ними, використовуючи `models.mode: "merge"`, щоб резервні варіанти залишалися доступними з дотриманням вибраного регіонального постачальника.
  </Accordion>

  <Accordion title="Чи потрібно купувати Mac Mini, щоб це встановити?">
    Ні. OpenClaw працює на macOS або Linux (Windows через WSL2). Mac mini необов'язковий — деякі люди
    купують його як постійно ввімкнений хост, але невеликий VPS, домашній сервер або пристрій класу Raspberry Pi теж підійдуть.

    Mac потрібен лише **для інструментів, доступних тільки на macOS**. Для iMessage використовуйте [BlueBubbles](/uk/channels/bluebubbles) (рекомендовано) — сервер BlueBubbles працює на будь-якому Mac, а Gateway може працювати на Linux або деінде. Якщо вам потрібні інші інструменти, доступні тільки на macOS, запускайте Gateway на Mac або спаруйте macOS-вузол.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Вузли](/uk/nodes), [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи потрібен Mac mini для підтримки iMessage?">
    Вам потрібен **будь-який пристрій macOS**, на якому виконано вхід у Messages. Це **не** має бути Mac mini —
    підійде будь-який Mac. **Використовуйте [BlueBubbles](/uk/channels/bluebubbles)** (рекомендовано) для iMessage — сервер BlueBubbles працює на macOS, тоді як Gateway може працювати на Linux або деінде.

    Типові конфігурації:

    - Запускайте Gateway на Linux/VPS, а сервер BlueBubbles — на будь-якому Mac, де виконано вхід у Messages.
    - Запускайте все на Mac, якщо хочете найпростішу конфігурацію на одній машині.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Вузли](/uk/nodes),
    [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Якщо я куплю Mac mini для запуску OpenClaw, чи можу я підключити його до свого MacBook Pro?">
    Так. **Mac mini може запускати Gateway**, а ваш MacBook Pro може підключатися як
    **вузол** (супровідний пристрій). Вузли не запускають Gateway — вони надають додаткові
    можливості, як-от екран/камера/canvas і `system.run` на цьому пристрої.

    Типовий шаблон:

    - Gateway на Mac mini (постійно ввімкнений).
    - MacBook Pro запускає застосунок macOS або хост вузла та спаровується з Gateway.
    - Використовуйте `openclaw nodes status` / `openclaw nodes list`, щоб побачити його.

    Документація: [Вузли](/uk/nodes), [CLI вузлів](/uk/cli/nodes).

  </Accordion>

  <Accordion title="Чи можна використовувати Bun?">
    Bun **не рекомендовано**. Ми бачимо помилки середовища виконання, особливо з WhatsApp і Telegram.
    Використовуйте **Node** для стабільних gateway.

    Якщо ви все ж хочете поекспериментувати з Bun, робіть це на невиробничому gateway
    без WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: що вказувати в allowFrom?">
    `channels.telegram.allowFrom` — це **ідентифікатор користувача Telegram людського відправника** (числовий). Це не ім'я користувача бота.

    Налаштування запитує лише числові ідентифікатори користувачів. Якщо у вашій конфігурації вже є застарілі записи `@username`, `openclaw doctor --fix` може спробувати їх розпізнати.

    Безпечніше (без стороннього бота):

    - Напишіть боту в DM, потім запустіть `openclaw logs --follow` і прочитайте `from.id`.

    Офіційний Bot API:

    - Напишіть боту в DM, потім викличте `https://api.telegram.org/bot<bot_token>/getUpdates` і прочитайте `message.from.id`.

    Сторонні сервіси (менше приватності):

    - Напишіть у DM `@userinfobot` або `@getidsbot`.

    Див. [/channels/telegram](/uk/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Чи можуть кілька людей використовувати один номер WhatsApp з різними екземплярами OpenClaw?">
    Так, через **маршрутизацію кількох агентів**. Прив'яжіть **DM** WhatsApp кожного відправника (peer `kind: "direct"`, відправник E.164 на кшталт `+15551234567`) до іншого `agentId`, щоб кожна людина отримала власний робочий простір і сховище сеансів. Відповіді все одно надходять з **того самого облікового запису WhatsApp**, а контроль доступу DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) є глобальним для облікового запису WhatsApp. Див. [Маршрутизація кількох агентів](/uk/concepts/multi-agent) і [WhatsApp](/uk/channels/whatsapp).
  </Accordion>

  <Accordion title='Чи можу я запустити агента "швидкий чат" і агента "Opus для кодування"?'>
    Так. Використовуйте маршрутизацію кількох агентів: задайте кожному агенту власну стандартну модель, а потім прив'яжіть вхідні маршрути (обліковий запис постачальника або конкретні peers) до кожного агента. Приклад конфігурації є в [Маршрутизація кількох агентів](/uk/concepts/multi-agent). Див. також [Моделі](/uk/concepts/models) і [Конфігурація](/uk/gateway/configuration).
  </Accordion>

  <Accordion title="Чи працює Homebrew на Linux?">
    Так. Homebrew підтримує Linux (Linuxbrew). Швидке налаштування:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Якщо ви запускаєте OpenClaw через systemd, переконайтеся, що PATH сервісу містить `/home/linuxbrew/.linuxbrew/bin` (або ваш brew prefix), щоб інструменти, установлені через `brew`, розпізнавалися в non-login shells.
    Останні збірки також додають на початок поширені користувацькі каталоги bin у сервісах Linux systemd (наприклад `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) і враховують `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` і `FNM_DIR`, якщо їх задано.

  </Accordion>

  <Accordion title="Різниця між hackable git install і npm install">
    - **Hackable (git) install:** повне checkout вихідного коду, редаговане, найкраще для контриб'юторів.
      Ви запускаєте збірки локально й можете виправляти код/документацію.
    - **npm install:** глобальне встановлення CLI, без репозиторію, найкраще для "просто запустити".
      Оновлення надходять з npm dist-tags.

    Документація: [Початок роботи](/uk/start/getting-started), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Чи можу я пізніше перемикатися між npm і git install?">
    Так. Використовуйте `openclaw update --channel ...`, коли OpenClaw уже встановлено.
    Це **не видаляє ваші дані** — це лише змінює встановлення коду OpenClaw.
    Ваш стан (`~/.openclaw`) і робочий простір (`~/.openclaw/workspace`) залишаються недоторканими.

    З npm на git:

    ```bash
    openclaw update --channel dev
    ```

    З git на npm:

    ```bash
    openclaw update --channel stable
    ```

    Додайте `--dry-run`, щоб спочатку переглянути заплановане перемикання режиму. Оновлювач запускає
    подальші кроки Doctor, оновлює джерела plugin для цільового каналу та
    перезапускає gateway, якщо ви не передали `--no-restart`.

    Інсталятор також може примусово вибрати будь-який режим:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Поради щодо резервного копіювання: див. [Стратегія резервного копіювання](/uk/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Чи варто запускати Gateway на ноутбуці чи VPS?">
    Коротка відповідь: **якщо вам потрібна надійність 24/7, використовуйте VPS**. Якщо вам потрібне
    мінімальне тертя і вас влаштовують сон/перезапуски, запускайте локально.

    **Ноутбук (локальний Gateway)**

    - **Переваги:** немає витрат на сервер, прямий доступ до локальних файлів, живе вікно браузера.
    - **Недоліки:** сон/збої мережі = роз'єднання, оновлення ОС/перезавантаження переривають роботу, пристрій має не засинати.

    **Примітка щодо OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord добре працюють із VPS. Єдиний реальний компроміс — **безголовий браузер** проти видимого вікна. Див. [Браузер](/uk/tools/browser).

    **Рекомендовано за замовчуванням:** VPS, якщо раніше у вас були роз'єднання gateway. Локальний варіант чудовий, коли ви активно користуєтеся Mac і хочете мати доступ до локальних файлів або автоматизацію UI з видимим браузером.

  </Accordion>

  <Accordion title="Наскільки важливо запускати OpenClaw на виділеній машині?">
    Не обов'язково, але **рекомендовано для надійності та ізоляції**.

    - **Виділений хост (VPS/Mac mini/Pi):** завжди увімкнений, менше переривань через сон/перезавантаження, чистіші дозволи, легше підтримувати роботу.
    - **Спільний ноутбук/настільний комп'ютер:** цілком підходить для тестування й активного використання, але очікуйте пауз, коли машина засинає або оновлюється.

    Якщо хочете найкраще з обох варіантів, тримайте Gateway на виділеному хості та сполучіть свій ноутбук як **Node** для локальних інструментів екрана/камери/виконання команд. Див. [Вузли](/uk/nodes).
    Настанови з безпеки див. у [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які мінімальні вимоги до VPS і рекомендована ОС?">
    OpenClaw легкий. Для базового Gateway + одного каналу чату:

    - **Абсолютний мінімум:** 1 vCPU, 1 ГБ RAM, ~500 МБ диска.
    - **Рекомендовано:** 1-2 vCPU, 2 ГБ RAM або більше для запасу (журнали, медіа, кілька каналів). Інструменти Node та автоматизація браузера можуть вимагати багато ресурсів.

    ОС: використовуйте **Ubuntu LTS** (або будь-яку сучасну Debian/Ubuntu). Шлях встановлення для Linux найкраще протестований там.

    Документація: [Linux](/uk/platforms/linux), [хостинг VPS](/uk/vps).

  </Accordion>

  <Accordion title="Чи можна запускати OpenClaw у VM і які вимоги?">
    Так. Розглядайте VM так само, як VPS: вона має бути завжди увімкнена, доступна та мати достатньо
    RAM для Gateway і будь-яких каналів, які ви ввімкнете.

    Базові рекомендації:

    - **Абсолютний мінімум:** 1 vCPU, 1 ГБ RAM.
    - **Рекомендовано:** 2 ГБ RAM або більше, якщо ви запускаєте кілька каналів, автоматизацію браузера або медіаінструменти.
    - **ОС:** Ubuntu LTS або інша сучасна Debian/Ubuntu.

    Якщо ви на Windows, **WSL2 — найпростіший варіант налаштування у стилі VM** і має найкращу
    сумісність з інструментами. Див. [Windows](/uk/platforms/windows), [хостинг VPS](/uk/vps).
    Якщо ви запускаєте macOS у VM, див. [VM macOS](/uk/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Пов'язане

- [FAQ](/uk/help/faq) — основний FAQ (моделі, сеанси, gateway, безпека тощо)
- [Огляд встановлення](/uk/install)
- [Початок роботи](/uk/start/getting-started)
- [Усунення несправностей](/uk/help/troubleshooting)
