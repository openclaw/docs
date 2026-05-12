---
read_when:
    - Нове встановлення, зависання під час початкового налаштування або помилки першого запуску
    - Вибір автентифікації та підписок провайдера
    - Не вдається отримати доступ до docs.openclaw.ai, не вдається відкрити панель керування, встановлення зависло
sidebarTitle: First-run FAQ
summary: 'Поширені запитання: швидкий старт і налаштування під час першого запуску — встановлення, онбординг, автентифікація, підписки, початкові збої'
title: 'Поширені запитання: налаштування під час першого запуску'
x-i18n:
    generated_at: "2026-05-12T00:59:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 24ce8cda091fd7d1bdcb405d421a1a3cabb134c3cc36b42f11b9b3f97782794b
    source_path: help/faq-first-run.md
    workflow: 16
---

  Швидкий старт і Q&A для першого запуску. Для повсякденних операцій, моделей, автентифікації, сеансів
  і усунення несправностей див. основний [FAQ](/uk/help/faq).

  ## Швидкий старт і налаштування першого запуску

  <AccordionGroup>
  <Accordion title="Я застряг, найшвидший спосіб розблокуватися">
    Використайте локального AI-агента, який може **бачити ваш комп'ютер**. Це значно ефективніше, ніж питати
    в Discord, бо більшість випадків "я застряг" - це **проблеми локальної конфігурації або середовища**, які
    віддалені помічники не можуть оглянути.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Ці інструменти можуть читати репозиторій, виконувати команди, оглядати журнали й допомагати виправляти налаштування
    на рівні вашого комп'ютера (PATH, служби, дозволи, файли автентифікації). Надайте їм **повний checkout вихідного коду** через
    hackable (git) встановлення:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це встановлює OpenClaw **з git checkout**, тож агент може читати код + документацію і
    міркувати про точну версію, яку ви запускаєте. Ви завжди можете пізніше повернутися до стабільної версії,
    повторно запустивши інсталятор без `--install-method git`.

    Порада: попросіть агента **спланувати й наглядати** за виправленням (крок за кроком), а потім виконати лише
    потрібні команди. Так зміни будуть меншими й простішими для аудиту.

    Якщо ви знайдете справжню помилку або виправлення, будь ласка, створіть GitHub issue або надішліть PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Почніть із цих команд (діліться виводом, коли просите про допомогу):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Що вони роблять:

    - `openclaw status`: швидкий знімок стану gateway/agent + базова конфігурація.
    - `openclaw models status`: перевіряє автентифікацію провайдера + доступність моделей.
    - `openclaw doctor`: перевіряє й виправляє поширені проблеми конфігурації/стану.

    Інші корисні перевірки CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Швидкий цикл налагодження: [Перші 60 секунд, якщо щось зламано](/uk/help/faq#first-60-seconds-if-something-is-broken).
    Документація зі встановлення: [Встановлення](/uk/install), [Прапорці інсталятора](/uk/install/installer), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Heartbeat постійно пропускається. Що означають причини пропуску?">
    Поширені причини пропуску heartbeat:

    - `quiet-hours`: поза налаштованим вікном активних годин
    - `empty-heartbeat-file`: `HEARTBEAT.md` існує, але містить лише порожній/тільки із заголовками каркас
    - `no-tasks-due`: режим завдань `HEARTBEAT.md` активний, але жоден з інтервалів завдань ще не настав
    - `alerts-disabled`: уся видимість heartbeat вимкнена (`showOk`, `showAlerts` і `useIndicator` вимкнені)

    У режимі завдань часові позначки термінів зсуваються лише після завершення справжнього запуску heartbeat.
    Пропущені запуски не позначають завдання як завершені.

    Документація: [Heartbeat](/uk/gateway/heartbeat), [Автоматизація](/uk/automation).

  </Accordion>

  <Accordion title="Рекомендований спосіб встановити й налаштувати OpenClaw">
    Репозиторій рекомендує запуск із вихідного коду та використання onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Майстер також може автоматично зібрати UI-ресурси. Після onboarding ви зазвичай запускаєте Gateway на порту **18789**.

    З вихідного коду (для контриб'юторів/розробки):

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

  <Accordion title="Як відкрити dashboard після onboarding?">
    Майстер відкриває браузер із чистою (нетокенізованою) URL-адресою dashboard одразу після onboarding, а також друкує посилання в підсумку. Тримайте цю вкладку відкритою; якщо вона не запустилася, скопіюйте/вставте надруковану URL-адресу на тому самому комп'ютері.
  </Accordion>

  <Accordion title="Як автентифікувати dashboard на localhost і віддалено?">
    **Localhost (той самий комп'ютер):**

    - Відкрийте `http://127.0.0.1:18789/`.
    - Якщо запитується автентифікація за спільним секретом, вставте налаштований токен або пароль у налаштування Control UI.
    - Джерело токена: `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`).
    - Джерело пароля: `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо спільний секрет ще не налаштовано, згенеруйте токен за допомогою `openclaw doctor --generate-gateway-token`.

    **Не на localhost:**

    - **Tailscale Serve** (рекомендовано): залиште bind на loopback, запустіть `openclaw gateway --tailscale serve`, відкрийте `https://<magicdns>/`. Якщо `gateway.auth.allowTailscale` має значення `true`, заголовки ідентичності задовольняють автентифікацію Control UI/WebSocket (без вставленого спільного секрету, за умови довіреного хоста gateway); HTTP API все ще потребують автентифікації за спільним секретом, якщо ви свідомо не використовуєте private-ingress `none` або trusted-proxy HTTP auth.
      Невдалі одночасні спроби Serve auth від того самого клієнта серіалізуються до того, як failed-auth limiter їх зафіксує, тож друга невдала повторна спроба вже може показати `retry later`.
    - **Tailnet bind**: запустіть `openclaw gateway --bind tailnet --token "<token>"` (або налаштуйте автентифікацію паролем), відкрийте `http://<tailscale-ip>:18789/`, а потім вставте відповідний спільний секрет у налаштуваннях dashboard.
    - **Identity-aware reverse proxy**: тримайте Gateway за довіреним proxy, налаштуйте `gateway.auth.mode: "trusted-proxy"`, а потім відкрийте URL-адресу proxy. Same-host loopback proxy потребують явного `gateway.auth.trustedProxy.allowLoopback = true`.
    - **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, потім відкрийте `http://127.0.0.1:18789/`. Автентифікація за спільним секретом усе ще застосовується через тунель; вставте налаштований токен або пароль, якщо буде запит.

    Див. [Dashboard](/uk/web/dashboard) і [Веб-поверхні](/uk/web) щодо режимів bind і деталей автентифікації.

  </Accordion>

  <Accordion title="Чому є дві конфігурації схвалення exec для схвалень у чаті?">
    Вони керують різними рівнями:

    - `approvals.exec`: пересилає запити схвалення до чатів призначення
    - `channels.<channel>.execApprovals`: робить цей канал нативним клієнтом схвалення для exec approvals

    Політика exec на хості все ще є справжнім шлюзом схвалення. Конфігурація чату керує лише тим, де
    з'являються запити схвалення і як люди можуть на них відповідати.

    У більшості налаштувань вам **не** потрібні обидва:

    - Якщо чат уже підтримує команди й відповіді, same-chat `/approve` працює через спільний шлях.
    - Якщо підтримуваний нативний канал може безпечно визначати approvers, OpenClaw тепер автоматично вмикає DM-first native approvals, коли `channels.<channel>.execApprovals.enabled` не задано або має значення `"auto"`.
    - Коли доступні native approval cards/buttons, цей нативний UI є основним шляхом; агент має включати ручну команду `/approve` лише якщо результат інструмента каже, що chat approvals недоступні або ручне схвалення є єдиним шляхом.
    - Використовуйте `approvals.exec` лише коли запити також треба пересилати в інші чати або явні ops rooms.
    - Використовуйте `channels.<channel>.execApprovals.target: "channel"` або `"both"` лише коли ви явно хочете, щоб запити схвалення публікувалися назад у вихідну кімнату/тему.
    - Схвалення Plugin знову окремі: вони типово використовують same-chat `/approve`, необов'язкове пересилання `approvals.plugin`, і лише деякі нативні канали додатково зберігають plugin-approval-native handling.

    Коротко: forwarding призначений для маршрутизації, native client config - для багатшого channel-specific UX.
    Див. [Exec Approvals](/uk/tools/exec-approvals).

  </Accordion>

  <Accordion title="Який runtime мені потрібен?">
    Потрібен Node **>= 22**. Рекомендовано `pnpm`. Bun **не рекомендовано** для Gateway.
  </Accordion>

  <Accordion title="Чи працює це на Raspberry Pi?">
    Так. Gateway легковагий - у документації зазначено **512MB-1GB RAM**, **1 core** і приблизно **500MB**
    диска як достатньо для особистого використання, а також зазначено, що **Raspberry Pi 4 може його запускати**.

    Якщо вам потрібен додатковий запас (журнали, медіа, інші служби), **рекомендовано 2GB**, але це
    не жорсткий мінімум.

    Порада: невеликий Pi/VPS може хостити Gateway, а ви можете під'єднати **nodes** на своєму ноутбуці/телефоні для
    локального екрана/камери/canvas або виконання команд. Див. [Nodes](/uk/nodes).

  </Accordion>

  <Accordion title="Є поради для встановлення на Raspberry Pi?">
    Коротко: працює, але очікуйте нерівностей.

    - Використовуйте **64-bit** OS і тримайте Node >= 22.
    - Надавайте перевагу **hackable (git) install**, щоб бачити журнали й швидко оновлюватися.
    - Почніть без каналів/skills, потім додавайте їх по одному.
    - Якщо натрапите на дивні binary issues, зазвичай це проблема **ARM compatibility**.

    Документація: [Linux](/uk/platforms/linux), [Встановлення](/uk/install).

  </Accordion>

  <Accordion title="Зависло на wake up my friend / onboarding will not hatch. Що тепер?">
    Цей екран залежить від того, чи Gateway доступний і автентифікований. TUI також надсилає
    "Wake up, my friend!" автоматично під час першого hatch. Якщо ви бачите цей рядок **без відповіді**
    і токени залишаються на 0, агент ніколи не запустився.

    1. Перезапустіть Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Перевірте status + auth:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Якщо все ще зависає, запустіть:

    ```bash
    openclaw doctor
    ```

    Якщо Gateway віддалений, переконайтеся, що tunnel/Tailscale з'єднання активне і що UI
    спрямований на правильний Gateway. Див. [Віддалений доступ](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Чи можу я перенести моє налаштування на новий комп'ютер (Mac mini) без повторного onboarding?">
    Так. Скопіюйте **каталог стану** і **workspace**, потім один раз запустіть Doctor. Це
    зберігає вашого бота "точно таким самим" (пам'ять, історію сеансів, автентифікацію і стан
    каналу), доки ви копіюєте **обидва** розташування:

    1. Встановіть OpenClaw на новому комп'ютері.
    2. Скопіюйте `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`) зі старого комп'ютера.
    3. Скопіюйте свій workspace (типово: `~/.openclaw/workspace`).
    4. Запустіть `openclaw doctor` і перезапустіть службу Gateway.

    Це зберігає config, auth profiles, WhatsApp creds, sessions і memory. Якщо ви в
    remote mode, пам'ятайте, що gateway host володіє session store і workspace.

    **Важливо:** якщо ви лише commit/push свій workspace у GitHub, ви робите резервну копію
    **memory + bootstrap files**, але **не** session history або auth. Вони живуть
    у `~/.openclaw/` (наприклад `~/.openclaw/agents/<agentId>/sessions/`).

    Пов'язане: [Міграція](/uk/install/migrating), [Де все зберігається на диску](/uk/help/faq#where-things-live-on-disk),
    [Agent workspace](/uk/concepts/agent-workspace), [Doctor](/uk/gateway/doctor),
    [Remote mode](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де подивитися, що нового в останній версії?">
    Перевірте changelog GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Найновіші записи розташовані вгорі. Якщо верхній розділ позначено **Unreleased**, наступний датований
    розділ є останньою випущеною версією. Записи згруповані за **Highlights**, **Changes** і
    **Fixes** (плюс розділи docs/other за потреби).

  </Accordion>

  <Accordion title="Не вдається отримати доступ до docs.openclaw.ai (SSL error)">
    Деякі з'єднання Comcast/Xfinity неправильно блокують `docs.openclaw.ai` через Xfinity
    Advanced Security. Вимкніть його або додайте `docs.openclaw.ai` до allowlist, потім повторіть спробу.
    Будь ласка, допоможіть нам розблокувати це, повідомивши тут: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Якщо ви все ще не можете відкрити сайт, документацію продубльовано на GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Різниця між стабільною та бета-версією">
    **Стабільна** та **бета** — це **npm dist-tags**, а не окремі лінії коду:

    - `latest` = стабільна
    - `beta` = рання збірка для тестування

    Зазвичай стабільний реліз спершу потрапляє в **beta**, а потім явний
    крок просування переміщує ту саму версію в `latest`. Мейнтейнери також можуть
    публікувати одразу в `latest`, коли це потрібно. Саме тому beta і stable можуть
    вказувати на **ту саму версію** після просування.

    Перегляньте, що змінилося:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Для однорядкових команд встановлення та різниці між beta і dev дивіться акордеон нижче.

  </Accordion>

  <Accordion title="Як установити бета-версію і яка різниця між beta та dev?">
    **Beta** — це npm dist-tag `beta` (може збігатися з `latest` після просування).
    **Dev** — це рухома верхівка `main` (git); під час публікації вона використовує npm dist-tag `dev`.

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

  <Accordion title="Як спробувати найновіші збірки?">
    Два варіанти:

    1. **Канал Dev (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Це перемикає на гілку `main` і оновлює з вихідного коду.

    2. **Встановлення з можливістю редагування (із сайту інсталятора):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це дає вам локальний репозиторій, який можна редагувати, а потім оновлювати через git.

    Якщо ви віддаєте перевагу чистому ручному клонуванню, використайте:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Документація: [Оновлення](/uk/cli/update), [Канали розробки](/uk/install/development-channels),
    [Встановлення](/uk/install).

  </Accordion>

  <Accordion title="Скільки зазвичай триває встановлення й початкове налаштування?">
    Орієнтовно:

    - **Встановлення:** 2-5 хвилин
    - **Початкове налаштування:** 5-15 хвилин залежно від того, скільки каналів/моделей ви налаштовуєте

    Якщо процес зависає, скористайтеся [Інсталятор завис](#quick-start-and-first-run-setup)
    і швидким циклом налагодження в [Я застряг](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Інсталятор завис? Як отримати більше зворотного зв'язку?">
    Повторно запустіть інсталятор із **докладним виводом**:

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
    Дві поширені проблеми у Windows:

    **1) Помилка npm spawn git / git не знайдено**

    - Установіть **Git for Windows** і переконайтеся, що `git` є у вашому PATH.
    - Закрийте й знову відкрийте PowerShell, потім повторно запустіть інсталятор.

    **2) openclaw не розпізнається після встановлення**

    - Ваша глобальна папка npm bin не входить до PATH.
    - Перевірте шлях:

      ```powershell
      npm config get prefix
      ```

    - Додайте цей каталог до вашого користувацького PATH (у Windows суфікс `\bin` не потрібен; у більшості систем це `%AppData%\npm`).
    - Закрийте й знову відкрийте PowerShell після оновлення PATH.

    Якщо хочете найплавніше налаштування Windows, використовуйте **WSL2** замість нативної Windows.
    Документація: [Windows](/uk/platforms/windows).

  </Accordion>

  <Accordion title="Вивід exec у Windows показує спотворений китайський текст — що робити?">
    Зазвичай це невідповідність кодової сторінки консолі в нативних оболонках Windows.

    Симптоми:

    - вивід `system.run`/`exec` показує китайський текст як mojibake
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

    Якщо ви все ще відтворюєте це на найновішому OpenClaw, відстежуйте/повідомте про це тут:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Документація не відповіла на моє запитання — як отримати кращу відповідь?">
    Використайте **встановлення з можливістю редагування (git)**, щоб мати повний вихідний код і документацію локально, а потім запитайте
    свого бота (або Claude/Codex) _з цієї папки_, щоб він міг прочитати репозиторій і відповісти точно.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Докладніше: [Встановлення](/uk/install) і [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Як установити OpenClaw на Linux?">
    Коротка відповідь: дотримуйтесь посібника для Linux, потім запустіть початкове налаштування.

    - Швидкий шлях Linux + встановлення служби: [Linux](/uk/platforms/linux).
    - Повний покроковий посібник: [Початок роботи](/uk/start/getting-started).
    - Інсталятор + оновлення: [Встановлення та оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Як установити OpenClaw на VPS?">
    Підійде будь-який Linux VPS. Установіть на сервері, потім використовуйте SSH/Tailscale, щоб отримати доступ до Gateway.

    Посібники: [exe.dev](/uk/install/exe-dev), [Hetzner](/uk/install/hetzner), [Fly.io](/uk/install/fly).
    Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де посібники зі встановлення в хмарі/VPS?">
    Ми підтримуємо **хаб хостингу** з поширеними провайдерами. Виберіть один і дотримуйтесь посібника:

    - [VPS-хостинг](/uk/vps) (усі провайдери в одному місці)
    - [Fly.io](/uk/install/fly)
    - [Hetzner](/uk/install/hetzner)
    - [exe.dev](/uk/install/exe-dev)

    Як це працює в хмарі: **Gateway працює на сервері**, а ви отримуєте до нього доступ
    зі свого ноутбука/телефона через Control UI (або Tailscale/SSH). Ваш стан + робоча область
    зберігаються на сервері, тому вважайте хост джерелом істини й робіть резервні копії.

    Ви можете прив'язати **вузли** (Mac/iOS/Android/headless) до цього хмарного Gateway, щоб отримати доступ
    до локального екрана/камери/canvas або запускати команди на своєму ноутбуці, зберігаючи
    Gateway у хмарі.

    Хаб: [Платформи](/uk/platforms). Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).
    Вузли: [Вузли](/uk/nodes), [CLI вузлів](/uk/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я попросити OpenClaw оновити себе?">
    Коротка відповідь: **можливо, але не рекомендовано**. Процес оновлення може перезапустити
    Gateway (що скине активну сесію), може потребувати чистого git checkout і
    може попросити підтвердження. Безпечніше: запускати оновлення з оболонки як оператор.

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

  <Accordion title="Що насправді робить початкове налаштування?">
    `openclaw onboard` — рекомендований шлях налаштування. У **локальному режимі** він проводить вас через:

    - **Налаштування моделі/автентифікації** (OAuth провайдера, API-ключі, Anthropic setup-token, а також локальні варіанти моделей, як-от LM Studio)
    - Розташування **робочої області** + початкові файли
    - **Налаштування Gateway** (bind/port/auth/tailscale)
    - **Канали** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, а також вбудовані Plugin каналів, як-от QQ Bot)
    - **Встановлення демона** (LaunchAgent на macOS; systemd user unit на Linux/WSL2)
    - **Перевірки стану** і вибір **skills**

    Він також попереджає, якщо ваша налаштована модель невідома або бракує автентифікації.

  </Accordion>

  <Accordion title="Чи потрібна підписка Claude або OpenAI, щоб це запускати?">
    Ні. Ви можете запускати OpenClaw з **API-ключами** (Anthropic/OpenAI/інші) або з
    **лише локальними моделями**, щоб ваші дані залишалися на вашому пристрої. Підписки (Claude
    Pro/Max або OpenAI Codex) — це необов'язкові способи автентифікації цих провайдерів.

    Для Anthropic в OpenClaw практичний поділ такий:

    - **API-ключ Anthropic**: звичайний білінг Anthropic API
    - **Claude CLI / автентифікація підписки Claude в OpenClaw**: співробітники Anthropic
      повідомили нам, що таке використання знову дозволене, і OpenClaw вважає використання `claude -p`
      санкціонованим для цієї інтеграції, якщо Anthropic не опублікує нову
      політику

    Для довготривалих хостів gateway API-ключі Anthropic усе ще є більш
    передбачуваним налаштуванням. OpenAI Codex OAuth явно підтримується для зовнішніх
    інструментів, як-от OpenClaw.

    OpenClaw також підтримує інші розміщені варіанти в стилі підписки, зокрема
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** і
    **Z.AI / GLM Coding Plan**.

    Документація: [Anthropic](/uk/providers/anthropic), [OpenAI](/uk/providers/openai),
    [Qwen Cloud](/uk/providers/qwen),
    [MiniMax](/uk/providers/minimax), [Моделі GLM](/uk/providers/glm),
    [Локальні моделі](/uk/gateway/local-models), [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Чи можу я використовувати підписку Claude Max без API-ключа?">
    Так.

    Співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому
    OpenClaw вважає автентифікацію підписки Claude і використання `claude -p` санкціонованими
    для цієї інтеграції, якщо Anthropic не опублікує нову політику. Якщо хочете
    найпередбачуваніше серверне налаштування, натомість використовуйте API-ключ Anthropic.

  </Accordion>

  <Accordion title="Чи підтримуєте ви автентифікацію підписки Claude (Claude Pro або Max)?">
    Так.

    Співробітники Anthropic повідомили нам, що таке використання знову дозволене, тому OpenClaw вважає
    повторне використання Claude CLI і використання `claude -p` санкціонованими для цієї інтеграції,
    якщо Anthropic не опублікує нову політику.

    Anthropic setup-token усе ще доступний як підтримуваний шлях токена OpenClaw, але тепер OpenClaw віддає перевагу повторному використанню Claude CLI і `claude -p`, коли вони доступні.
    Для production або багатокористувацьких навантажень автентифікація через API-ключ Anthropic усе ще є
    безпечнішим і передбачуванішим вибором. Якщо хочете інші розміщені
    варіанти в стилі підписки в OpenClaw, дивіться [OpenAI](/uk/providers/openai), [Qwen / Model
    Cloud](/uk/providers/qwen), [MiniMax](/uk/providers/minimax) і [Моделі GLM](/uk/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Чому я бачу HTTP 429 rate_limit_error від Anthropic?">
    Це означає, що ваша **квота/ліміт швидкості Anthropic** вичерпано для поточного вікна. Якщо ви
    використовуєте **Claude CLI**, зачекайте, доки вікно скинеться, або оновіть свій план. Якщо ви
    використовуєте **API-ключ Anthropic**, перевірте Anthropic Console
    щодо використання/білінгу й за потреби підвищте ліміти.

    Якщо повідомлення конкретно таке:
    `Extra usage is required for long context requests`, запит намагається використати
    бета-версію 1M контексту Anthropic (`context1m: true`). Це працює лише тоді, коли ваші
    облікові дані придатні для білінгу довгого контексту (білінг API-ключа або
    шлях входу OpenClaw Claude з увімкненим Extra Usage).

    Порада: задайте **резервну модель**, щоб OpenClaw міг продовжувати відповідати, поки провайдер обмежений за частотою запитів.
    Див. [Моделі](/uk/cli/models), [OAuth](/uk/concepts/oauth) і
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/uk/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Чи підтримується AWS Bedrock?">
    Так. OpenClaw має вбудованого провайдера **Amazon Bedrock (Converse)**. За наявності маркерів середовища AWS OpenClaw може автоматично виявити потоковий/текстовий каталог Bedrock і об’єднати його як неявного провайдера `amazon-bedrock`; інакше ви можете явно ввімкнути `plugins.entries.amazon-bedrock.config.discovery.enabled` або додати запис провайдера вручну. Див. [Amazon Bedrock](/uk/providers/bedrock) і [Провайдери моделей](/uk/providers/models). Якщо ви віддаєте перевагу керованому потоку ключів, OpenAI-сумісний проксі перед Bedrock також залишається чинним варіантом.
  </Accordion>

  <Accordion title="Як працює автентифікація Codex?">
    OpenClaw підтримує **OpenAI Code (Codex)** через OAuth (вхід через ChatGPT). Використовуйте
    `openai/gpt-5.5` для типової конфігурації: автентифікація підписки ChatGPT/Codex плюс
    нативне виконання сервера застосунку Codex. Посилання на моделі `openai-codex/gpt-*` — це
    застаріла конфігурація, яку виправляє `openclaw doctor --fix`. Прямий доступ за API-ключем OpenAI
    залишається доступним для неагентних поверхонь OpenAI API та для агентних
    моделей через упорядкований профіль API-ключа `openai-codex`.
    Див. [Провайдери моделей](/uk/concepts/model-providers) і [Онбординг (CLI)](/uk/start/wizard).
  </Accordion>

  <Accordion title="Чому OpenClaw досі згадує openai-codex?">
    `openai-codex` — це id провайдера та профілю автентифікації для ChatGPT/Codex OAuth.
    Старіші конфігурації також використовували його як префікс моделі:

    - `openai/gpt-5.5` = автентифікація підписки ChatGPT/Codex із нативним середовищем виконання Codex для ходів агента
    - `openai-codex/gpt-5.5` = застарілий маршрут моделі, який виправляє `openclaw doctor --fix`
    - `openai/gpt-5.5` плюс упорядкований профіль API-ключа `openai-codex` = автентифікація за API-ключем для агентної моделі OpenAI
    - `openai-codex:...` = id профілю автентифікації, а не посилання на модель

    Якщо вам потрібен прямий шлях білінгу/лімітів OpenAI Platform, задайте
    `OPENAI_API_KEY`. Якщо вам потрібна автентифікація підписки ChatGPT/Codex, увійдіть через
    `openclaw models auth login --provider openai-codex`. Залишайте посилання на модель як
    `openai/gpt-5.5`; посилання на моделі `openai-codex/*` — це застаріла конфігурація, яку
    `openclaw doctor --fix` переписує.

  </Accordion>

  <Accordion title="Чому ліміти Codex OAuth можуть відрізнятися від ChatGPT web?">
    Codex OAuth використовує керовані OpenAI, залежні від плану вікна квот. На практиці
    ці ліміти можуть відрізнятися від досвіду на вебсайті/у застосунку ChatGPT, навіть коли
    обидва прив’язані до того самого облікового запису.

    OpenClaw може показувати поточно видимі вікна використання/квот провайдера в
    `openclaw models status`, але він не вигадує й не нормалізує права ChatGPT-web
    у прямий доступ до API. Якщо вам потрібен прямий шлях білінгу/лімітів OpenAI Platform,
    використовуйте `openai/*` з API-ключем.

  </Accordion>

  <Accordion title="Чи підтримуєте ви автентифікацію за підпискою OpenAI (Codex OAuth)?">
    Так. OpenClaw повністю підтримує **OAuth підписки OpenAI Code (Codex)**.
    OpenAI явно дозволяє використання OAuth підписки в зовнішніх інструментах/робочих процесах
    на кшталт OpenClaw. Онбординг може виконати OAuth-потік за вас.

    Див. [OAuth](/uk/concepts/oauth), [Провайдери моделей](/uk/concepts/model-providers) і [Онбординг (CLI)](/uk/start/wizard).

  </Accordion>

  <Accordion title="Як налаштувати Gemini CLI OAuth?">
    Gemini CLI використовує **потік автентифікації Plugin**, а не client id чи secret в `openclaw.json`.

    Кроки:

    1. Встановіть Gemini CLI локально, щоб `gemini` був у `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Увімкніть Plugin: `openclaw plugins enable google`
    3. Увійдіть: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Модель за замовчуванням після входу: `google-gemini-cli/gemini-3-flash-preview`
    5. Якщо запити завершуються помилкою, задайте `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості gateway

    Це зберігає OAuth-токени в профілях автентифікації на хості gateway. Подробиці: [Провайдери моделей](/uk/concepts/model-providers).

  </Accordion>

  <Accordion title="Чи підходить локальна модель для звичайних чатів?">
    Зазвичай ні. OpenClaw потребує великого контексту + сильної безпеки; малі карти обрізають і пропускають дані. Якщо мусите, запускайте **найбільшу** збірку моделі, яку можете локально (LM Studio), і див. [/gateway/local-models](/uk/gateway/local-models). Менші/квантовані моделі збільшують ризик prompt-injection — див. [Безпека](/uk/gateway/security).
  </Accordion>

  <Accordion title="Як утримувати трафік hosted-моделей у певному регіоні?">
    Виберіть кінцеві точки, прив’язані до регіону. OpenRouter пропонує варіанти з хостингом у США для MiniMax, Kimi та GLM; виберіть варіант із хостингом у США, щоб утримувати дані в регіоні. Ви все одно можете перелічити Anthropic/OpenAI поруч із ними, використовуючи `models.mode: "merge"`, щоб резервні варіанти залишалися доступними, водночас дотримуючись обраного регіонального провайдера.
  </Accordion>

  <Accordion title="Чи потрібно купувати Mac Mini, щоб це встановити?">
    Ні. OpenClaw працює на macOS або Linux (Windows через WSL2). Mac mini необов’язковий — деякі люди
    купують його як постійно ввімкнений хост, але невеликий VPS, домашній сервер або пристрій класу Raspberry Pi теж підійде.

    Mac потрібен лише **для інструментів, доступних тільки на macOS**. Для iMessage використовуйте [iMessage](/uk/channels/imessage) з `imsg` на будь-якому Mac, де виконано вхід у Messages. Якщо Gateway працює на Linux або деінде, задайте `channels.imessage.cliPath` як SSH-обгортку, що запускає `imsg` на цьому Mac. Якщо вам потрібні інші інструменти лише для macOS, запускайте Gateway на Mac або під’єднайте macOS-вузол.

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

  <Accordion title="Якщо я куплю Mac mini для запуску OpenClaw, чи можу я під’єднати його до свого MacBook Pro?">
    Так. **Mac mini може запускати Gateway**, а ваш MacBook Pro може підключатися як
    **вузол** (супутній пристрій). Вузли не запускають Gateway — вони надають додаткові
    можливості, як-от екран/камера/canvas і `system.run` на цьому пристрої.

    Типовий шаблон:

    - Gateway на Mac mini (постійно ввімкнений).
    - MacBook Pro запускає застосунок macOS або хост вузла й спаровується з Gateway.
    - Використовуйте `openclaw nodes status` / `openclaw nodes list`, щоб побачити його.

    Документація: [Вузли](/uk/nodes), [CLI вузлів](/uk/cli/nodes).

  </Accordion>

  <Accordion title="Чи можна використовувати Bun?">
    Bun **не рекомендовано**. Ми бачимо помилки середовища виконання, особливо з WhatsApp і Telegram.
    Використовуйте **Node** для стабільних gateway.

    Якщо ви все ж хочете експериментувати з Bun, робіть це на непродукційному gateway
    без WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: що вказувати в allowFrom?">
    `channels.telegram.allowFrom` — це **Telegram user ID відправника-людини** (числовий). Це не ім’я користувача бота.

    Налаштування просить лише числові user ID. Якщо у вас уже є застарілі записи `@username` у конфігурації, `openclaw doctor --fix` може спробувати їх розв’язати.

    Безпечніше (без стороннього бота):

    - Надішліть DM своєму боту, потім запустіть `openclaw logs --follow` і прочитайте `from.id`.

    Офіційний Bot API:

    - Надішліть DM своєму боту, потім викличте `https://api.telegram.org/bot<bot_token>/getUpdates` і прочитайте `message.from.id`.

    Сторонній варіант (менш приватний):

    - Надішліть DM `@userinfobot` або `@getidsbot`.

    Див. [/channels/telegram](/uk/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Чи можуть кілька людей використовувати один номер WhatsApp з різними інстансами OpenClaw?">
    Так, через **маршрутизацію кількох агентів**. Прив’яжіть **DM** WhatsApp кожного відправника (peer `kind: "direct"`, відправник E.164 на кшталт `+15551234567`) до іншого `agentId`, щоб кожна людина мала власний workspace і сховище сесій. Відповіді все одно надходять з **того самого облікового запису WhatsApp**, а контроль доступу до DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) є глобальним для облікового запису WhatsApp. Див. [Маршрутизація кількох агентів](/uk/concepts/multi-agent) і [WhatsApp](/uk/channels/whatsapp).
  </Accordion>

  <Accordion title='Чи можу я запустити агента "fast chat" і агента "Opus for coding"?'>
    Так. Використовуйте маршрутизацію кількох агентів: призначте кожному агенту власну модель за замовчуванням, а потім прив’яжіть вхідні маршрути (обліковий запис провайдера або конкретні peers) до кожного агента. Приклад конфігурації є в [Маршрутизації кількох агентів](/uk/concepts/multi-agent). Див. також [Моделі](/uk/concepts/models) і [Конфігурація](/uk/gateway/configuration).
  </Accordion>

  <Accordion title="Чи працює Homebrew на Linux?">
    Так. Homebrew підтримує Linux (Linuxbrew). Швидке налаштування:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Якщо ви запускаєте OpenClaw через systemd, переконайтеся, що PATH служби містить `/home/linuxbrew/.linuxbrew/bin` (або ваш префікс brew), щоб інструменти, встановлені через `brew`, розв’язувалися в non-login shells.
    Останні збірки також додають на початок типові користувацькі bin-каталоги в службах Linux systemd (наприклад `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) і враховують `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` і `FNM_DIR`, коли їх задано.

  </Accordion>

  <Accordion title="Різниця між hackable git-встановленням і npm-встановленням">
    - **Hackable (git) install:** повний checkout вихідного коду, придатний для редагування, найкращий для контриб’юторів.
      Ви запускаєте збірки локально й можете виправляти код/документацію.
    - **npm install:** глобальне встановлення CLI, без репозиторію, найкраще для сценарію "просто запустити".
      Оновлення надходять із npm dist-tags.

    Документація: [Початок роботи](/uk/start/getting-started), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Чи можу я пізніше перемикатися між npm- і git-встановленнями?">
    Так. Використовуйте `openclaw update --channel ...`, коли OpenClaw уже встановлено.
    Це **не видаляє ваші дані** — це лише змінює встановлений код OpenClaw.
    Ваш стан (`~/.openclaw`) і workspace (`~/.openclaw/workspace`) залишаються недоторканими.

    З npm на git:

    ```bash
    openclaw update --channel dev
    ```

    З git на npm:

    ```bash
    openclaw update --channel stable
    ```

    Додайте `--dry-run`, щоб спочатку переглянути заплановане перемикання режиму. Оновлювач запускає
    подальші дії Doctor, оновлює джерела Plugin для цільового каналу та
    перезапускає gateway, якщо ви не передали `--no-restart`.

    Інсталятор також може примусово вибрати будь-який режим:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Поради щодо резервного копіювання: див. [Стратегія резервного копіювання](/uk/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Чи запускати Gateway на ноутбуці чи на VPS?">
    Коротка відповідь: **якщо вам потрібна надійність 24/7, використовуйте VPS**. Якщо вам потрібні
    мінімальні складнощі й вас влаштовують сон/перезапуски, запускайте локально.

    **Ноутбук (локальний Gateway)**

    - **Переваги:** немає витрат на сервер, прямий доступ до локальних файлів, живе вікно браузера.
    - **Недоліки:** сон/розриви мережі = відключення, оновлення ОС/перезавантаження переривають роботу, має залишатися активним.

    **VPS / хмара**

    - **Переваги:** постійна робота, стабільна мережа, немає проблем зі сном ноутбука, легше підтримувати в робочому стані.
    - **Недоліки:** часто працює без графічного інтерфейсу (використовуйте скриншоти), лише віддалений доступ до файлів, для оновлень потрібно підключатися через SSH.

    **Примітка щодо OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord коректно працюють із VPS. Єдиний реальний компроміс — **браузер без графічного інтерфейсу** проти видимого вікна. Див. [Браузер](/uk/tools/browser).

    **Рекомендований варіант за замовчуванням:** VPS, якщо раніше у вас були відключення Gateway. Локальний запуск добре підходить, коли ви активно користуєтеся Mac і хочете мати локальний доступ до файлів або UI-автоматизацію з видимим браузером.

  </Accordion>

  <Accordion title="Наскільки важливо запускати OpenClaw на виділеній машині?">
    Це не обов'язково, але **рекомендовано для надійності та ізоляції**.

    - **Виділений хост (VPS/Mac mini/Pi):** постійна робота, менше переривань через сон/перезавантаження, чистіші дозволи, легше підтримувати в робочому стані.
    - **Спільний ноутбук/десктоп:** цілком підходить для тестування й активного використання, але очікуйте пауз, коли машина переходить у сон або оновлюється.

    Якщо ви хочете отримати найкраще з обох підходів, тримайте Gateway на виділеному хості й підключіть свій ноутбук як **node** для локальних інструментів екрана/камери/виконання команд. Див. [Nodes](/uk/nodes).
    Рекомендації з безпеки див. у [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які мінімальні вимоги до VPS і рекомендована ОС?">
    OpenClaw є легким. Для базового Gateway + одного каналу чату:

    - **Абсолютний мінімум:** 1 vCPU, 1GB RAM, ~500MB диска.
    - **Рекомендовано:** 1-2 vCPU, 2GB RAM або більше для запасу (журнали, медіа, кілька каналів). Інструменти Node і автоматизація браузера можуть вимагати багато ресурсів.

    ОС: використовуйте **Ubuntu LTS** (або будь-яку сучасну Debian/Ubuntu). Шлях встановлення для Linux найкраще протестований саме там.

    Документація: [Linux](/uk/platforms/linux), [VPS-хостинг](/uk/vps).

  </Accordion>

  <Accordion title="Чи можу я запускати OpenClaw у VM і які вимоги?">
    Так. Ставтеся до VM так само, як до VPS: вона має бути постійно ввімкнена, доступна та мати достатньо
    RAM для Gateway і всіх каналів, які ви вмикаєте.

    Базові рекомендації:

    - **Абсолютний мінімум:** 1 vCPU, 1GB RAM.
    - **Рекомендовано:** 2GB RAM або більше, якщо ви запускаєте кілька каналів, автоматизацію браузера або медіаінструменти.
    - **ОС:** Ubuntu LTS або інша сучасна Debian/Ubuntu.

    Якщо ви на Windows, **WSL2 — найпростіший варіант налаштування у стилі VM** і має найкращу сумісність
    з інструментами. Див. [Windows](/uk/platforms/windows), [VPS-хостинг](/uk/vps).
    Якщо ви запускаєте macOS у VM, див. [macOS VM](/uk/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Пов'язане

- [FAQ](/uk/help/faq) — основний FAQ (моделі, сесії, gateway, безпека тощо)
- [Огляд встановлення](/uk/install)
- [Початок роботи](/uk/start/getting-started)
- [Усунення несправностей](/uk/help/troubleshooting)
