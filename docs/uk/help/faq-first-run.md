---
read_when:
    - Нове встановлення, зависання під час початкового налаштування або помилки першого запуску
    - Вибір автентифікації та підписок провайдера
    - Немає доступу до docs.openclaw.ai, не вдається відкрити панель керування, встановлення зависло
sidebarTitle: First-run FAQ
summary: 'Поширені запитання: швидкий старт і налаштування першого запуску — встановлення, онбординг, автентифікація, підписки, початкові збої'
title: 'Поширені запитання: налаштування під час першого запуску'
x-i18n:
    generated_at: "2026-05-11T20:41:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: f19f755d41dc09c17e20845487037d1edc338d0edff5fc0190973f3d72a7f0ab
    source_path: help/faq-first-run.md
    workflow: 16
---

  Питання й відповіді для швидкого старту та першого запуску. Для повсякденних операцій, моделей, автентифікації, сеансів
  і усунення несправностей див. основний [FAQ](/uk/help/faq).

  ## Швидкий старт і налаштування першого запуску

  <AccordionGroup>
  <Accordion title="Я застряг, найшвидший спосіб розблокуватися">
    Використайте локального AI-агента, який може **бачити вашу машину**. Це набагато ефективніше, ніж питати
    в Discord, бо більшість випадків "я застряг" - це **проблеми локальної конфігурації або середовища**, які
    віддалені помічники не можуть перевірити.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Ці інструменти можуть читати репозиторій, запускати команди, перевіряти журнали та допомагати виправляти налаштування
    на рівні машини (PATH, сервіси, дозволи, файли автентифікації). Надайте їм **повний checkout вихідного коду** через
    hackable (git) install:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це встановлює OpenClaw **з git checkout**, тож агент може читати код і документацію та
    аналізувати точну версію, яку ви запускаєте. Ви завжди можете пізніше повернутися до стабільної версії,
    повторно запустивши інсталятор без `--install-method git`.

    Порада: попросіть агента **спланувати та наглядати** за виправленням (покроково), а потім виконати лише
    необхідні команди. Це робить зміни меншими й простішими для аудиту.

    Якщо ви виявили справжню помилку або виправлення, будь ласка, створіть issue на GitHub або надішліть PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Почніть із цих команд (діліться виводом, коли просите про допомогу):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Що вони роблять:

    - `openclaw status`: швидкий знімок стану Gateway/агента + базова конфігурація.
    - `openclaw models status`: перевіряє автентифікацію провайдера + доступність моделей.
    - `openclaw doctor`: перевіряє та виправляє поширені проблеми конфігурації/стану.

    Інші корисні перевірки CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Швидкий цикл налагодження: [Перші 60 секунд, якщо щось зламано](/uk/help/faq#first-60-seconds-if-something-is-broken).
    Документація встановлення: [Встановлення](/uk/install), [Прапорці інсталятора](/uk/install/installer), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Heartbeat постійно пропускається. Що означають причини пропуску?">
    Поширені причини пропуску Heartbeat:

    - `quiet-hours`: поза налаштованим вікном активних годин
    - `empty-heartbeat-file`: `HEARTBEAT.md` існує, але містить лише порожній/тільки заголовковий шаблон
    - `no-tasks-due`: режим завдань `HEARTBEAT.md` активний, але інтервали жодного із завдань ще не настали
    - `alerts-disabled`: усю видимість Heartbeat вимкнено (`showOk`, `showAlerts` і `useIndicator` усі вимкнені)

    У режимі завдань часові позначки терміну виконання просуваються лише після завершення реального запуску Heartbeat.
    Пропущені запуски не позначають завдання як виконані.

    Документація: [Heartbeat](/uk/gateway/heartbeat), [Автоматизація та завдання](/uk/automation).

  </Accordion>

  <Accordion title="Рекомендований спосіб встановити й налаштувати OpenClaw">
    Репозиторій рекомендує запуск із вихідного коду та використання onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Майстер також може автоматично зібрати UI-ресурси. Після onboarding ви зазвичай запускаєте Gateway на порту **18789**.

    З вихідного коду (для контриб'юторів/розробників):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Якщо у вас ще немає глобального встановлення, запустіть це через `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Як відкрити панель керування після onboarding?">
    Майстер відкриває ваш браузер із чистою (нетокенізованою) URL-адресою панелі керування одразу після onboarding, а також друкує посилання в підсумку. Тримайте цю вкладку відкритою; якщо вона не запустилася, скопіюйте/вставте надруковану URL-адресу на тій самій машині.
  </Accordion>

  <Accordion title="Як автентифікувати панель керування на localhost порівняно з віддаленим доступом?">
    **Localhost (та сама машина):**

    - Відкрийте `http://127.0.0.1:18789/`.
    - Якщо він просить автентифікацію зі спільним секретом, вставте налаштований токен або пароль у налаштування Control UI.
    - Джерело токена: `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`).
    - Джерело пароля: `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо спільний секрет ще не налаштовано, згенеруйте токен за допомогою `openclaw doctor --generate-gateway-token`.

    **Не на localhost:**

    - **Tailscale Serve** (рекомендовано): залиште bind на loopback, запустіть `openclaw gateway --tailscale serve`, відкрийте `https://<magicdns>/`. Якщо `gateway.auth.allowTailscale` дорівнює `true`, заголовки ідентичності задовольняють автентифікацію Control UI/WebSocket (без вставленого спільного секрету, за умови довіреного хоста Gateway); HTTP API все ще потребують автентифікації зі спільним секретом, якщо ви навмисно не використовуєте private-ingress `none` або HTTP-автентифікацію trusted-proxy.
      Невдалі одночасні спроби автентифікації Serve від того самого клієнта серіалізуються до того, як обмежувач невдалих автентифікацій їх запише, тому друга невдала повторна спроба вже може показати `retry later`.
    - **Tailnet bind**: запустіть `openclaw gateway --bind tailnet --token "<token>"` (або налаштуйте автентифікацію паролем), відкрийте `http://<tailscale-ip>:18789/`, потім вставте відповідний спільний секрет у налаштуваннях панелі керування.
    - **Реверсний проксі з урахуванням ідентичності**: тримайте Gateway за довіреним проксі, налаштуйте `gateway.auth.mode: "trusted-proxy"`, потім відкрийте URL проксі. Loopback-проксі на тому самому хості потребують явного `gateway.auth.trustedProxy.allowLoopback = true`.
    - **SSH-тунель**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, потім відкрийте `http://127.0.0.1:18789/`. Автентифікація зі спільним секретом усе ще застосовується через тунель; вставте налаштований токен або пароль, якщо буде запит.

    Див. [Панель керування](/uk/web/dashboard) і [Вебповерхні](/uk/web) для режимів bind і подробиць автентифікації.

  </Accordion>

  <Accordion title="Чому є дві конфігурації схвалення exec для схвалень у чаті?">
    Вони керують різними рівнями:

    - `approvals.exec`: пересилає запити схвалення до чат-призначень
    - `channels.<channel>.execApprovals`: змушує цей канал діяти як нативний клієнт схвалення для exec-схвалень

    Політика exec хоста все ще є справжнім шлюзом схвалення. Конфігурація чату лише керує тим, де
    з'являються запити схвалення і як люди можуть на них відповідати.

    У більшості налаштувань вам **не** потрібні обидва:

    - Якщо чат уже підтримує команди й відповіді, `/approve` у тому самому чаті працює через спільний шлях.
    - Якщо підтримуваний нативний канал може безпечно визначити тих, хто схвалює, OpenClaw тепер автоматично вмикає DM-first нативні схвалення, коли `channels.<channel>.execApprovals.enabled` не задано або має значення `"auto"`.
    - Коли доступні нативні картки/кнопки схвалення, цей нативний UI є основним шляхом; агент має включати ручну команду `/approve` лише якщо результат інструмента каже, що чат-схвалення недоступні або ручне схвалення є єдиним шляхом.
    - Використовуйте `approvals.exec` лише коли запити також потрібно пересилати до інших чатів або явних ops-кімнат.
    - Використовуйте `channels.<channel>.execApprovals.target: "channel"` або `"both"` лише коли ви явно хочете, щоб запити схвалення публікувалися назад у вихідну кімнату/тему.
    - Схвалення Plugin знову окремі: за замовчуванням вони використовують `/approve` у тому самому чаті, опційне пересилання `approvals.plugin`, і лише деякі нативні канали додатково зберігають нативну обробку схвалень Plugin.

    Коротко: пересилання призначене для маршрутизації, а конфігурація нативного клієнта - для багатшого UX, специфічного для каналу.
    Див. [Exec-схвалення](/uk/tools/exec-approvals).

  </Accordion>

  <Accordion title="Яке середовище виконання мені потрібне?">
    Потрібен Node **>= 22**. Рекомендовано `pnpm`. Bun **не рекомендовано** для Gateway.
  </Accordion>

  <Accordion title="Чи працює це на Raspberry Pi?">
    Так. Gateway легковаговий - документація зазначає, що **512MB-1GB RAM**, **1 core** і приблизно **500MB**
    диска достатньо для особистого використання, і вказує, що **Raspberry Pi 4 може його запускати**.

    Якщо вам потрібен додатковий запас (журнали, медіа, інші сервіси), **рекомендовано 2GB**, але це
    не жорсткий мінімум.

    Порада: невеликий Pi/VPS може хостити Gateway, а ви можете сполучати **вузли** на ноутбуці/телефоні для
    локального екрана/камери/canvas або виконання команд. Див. [Вузли](/uk/nodes).

  </Accordion>

  <Accordion title="Є поради для встановлення на Raspberry Pi?">
    Коротко: це працює, але очікуйте шорсткостей.

    - Використовуйте **64-bit** ОС і тримайте Node >= 22.
    - Надавайте перевагу **hackable (git) install**, щоб бачити журнали й швидко оновлюватися.
    - Почніть без каналів/Skills, потім додавайте їх по одному.
    - Якщо натрапите на дивні проблеми з бінарними файлами, зазвичай це проблема **сумісності ARM**.

    Документація: [Linux](/uk/platforms/linux), [Встановлення](/uk/install).

  </Accordion>

  <Accordion title="Воно застрягло на wake up my friend / onboarding не вилуплюється. Що тепер?">
    Цей екран залежить від доступності та автентифікації Gateway. TUI також автоматично надсилає
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

    Якщо Gateway віддалений, переконайтеся, що тунель/з'єднання Tailscale активне і що UI
    вказує на правильний Gateway. Див. [Віддалений доступ](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Чи можу я перенести своє налаштування на нову машину (Mac mini), не проходячи onboarding заново?">
    Так. Скопіюйте **каталог стану** і **робочий простір**, потім один раз запустіть Doctor. Це
    зберігає вашого бота "точно таким самим" (пам'ять, історію сеансів, автентифікацію і стан каналів),
    якщо ви скопіюєте **обидва** розташування:

    1. Встановіть OpenClaw на новій машині.
    2. Скопіюйте `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`) зі старої машини.
    3. Скопіюйте свій робочий простір (типово: `~/.openclaw/workspace`).
    4. Запустіть `openclaw doctor` і перезапустіть сервіс Gateway.

    Це зберігає конфігурацію, профілі автентифікації, облікові дані WhatsApp, сеанси й пам'ять. Якщо ви в
    віддаленому режимі, пам'ятайте, що хост Gateway володіє сховищем сеансів і робочим простором.

    **Важливо:** якщо ви лише commit/push свій робочий простір на GitHub, ви створюєте резервну копію
    **пам'яті + bootstrap-файлів**, але **не** історії сеансів або автентифікації. Вони розташовані
    під `~/.openclaw/` (наприклад `~/.openclaw/agents/<agentId>/sessions/`).

    Пов'язане: [Міграція](/uk/install/migrating), [Де все зберігається на диску](/uk/help/faq#where-things-live-on-disk),
    [Робочий простір агента](/uk/concepts/agent-workspace), [Doctor](/uk/gateway/doctor),
    [Віддалений режим](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де побачити, що нового в останній версії?">
    Перевірте changelog на GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Найновіші записи розташовані вгорі. Якщо верхній розділ позначено **Unreleased**, наступний датований
    розділ є останньою випущеною версією. Записи згруповано за **Основними моментами**, **Змінами** та
    **Виправленнями** (плюс розділи документації/іншого, коли потрібно).

  </Accordion>

  <Accordion title="Немає доступу до docs.openclaw.ai (помилка SSL)">
    Деякі з'єднання Comcast/Xfinity неправильно блокують `docs.openclaw.ai` через Xfinity
    Advanced Security. Вимкніть це або додайте `docs.openclaw.ai` до allowlist, потім повторіть спробу.
    Будь ласка, допоможіть нам розблокувати це, повідомивши тут: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Якщо ви все ще не можете відкрити сайт, документацію дзеркально розміщено на GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Різниця між stable і beta">
    **Stable** і **beta** — це **npm dist-tags**, а не окремі гілки коду:

    - `latest` = stable
    - `beta` = рання збірка для тестування

    Зазвичай stable-реліз спочатку потрапляє в **beta**, а потім явний
    крок просування переміщує ту саму версію в `latest`. Мейнтейнери також можуть
    публікувати одразу в `latest`, коли це потрібно. Саме тому beta і stable можуть
    вказувати на **ту саму версію** після просування.

    Перегляньте, що змінилося:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Однорядкові команди встановлення та різницю між beta і dev дивіться в акордеоні нижче.

  </Accordion>

  <Accordion title="Як встановити beta-версію і яка різниця між beta і dev?">
    **Beta** — це npm dist-tag `beta` (після просування може збігатися з `latest`).
    **Dev** — це рухома верхівка `main` (git); коли її публікують, вона використовує npm dist-tag `dev`.

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

    1. **Dev-канал (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Це перемикає на гілку `main` і оновлює з вихідного коду.

    2. **Змінюване встановлення (із сайту інсталятора):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це дає вам локальний репозиторій, який можна редагувати, а потім оновлювати через git.

    Якщо ви віддаєте перевагу чистому ручному клонуванню, використовуйте:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Документація: [Оновлення](/uk/cli/update), [Канали розробки](/uk/install/development-channels),
    [Встановлення](/uk/install).

  </Accordion>

  <Accordion title="Скільки зазвичай тривають встановлення й onboarding?">
    Орієнтовно:

    - **Встановлення:** 2-5 хвилин
    - **Onboarding:** 5-15 хвилин залежно від того, скільки каналів/моделей ви налаштовуєте

    Якщо процес зависає, скористайтеся [Інсталятор завис](#quick-start-and-first-run-setup)
    і швидким циклом налагодження в [Я застряг](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Інсталятор завис? Як отримати більше зворотного зв’язку?">
    Запустіть інсталятор повторно з **докладним виводом**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Beta-встановлення з докладним виводом:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Для змінюваного (git) встановлення:

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

  <Accordion title="Встановлення у Windows каже, що git не знайдено або openclaw не розпізнано">
    Дві поширені проблеми у Windows:

    **1) Помилка npm spawn git / git не знайдено**

    - Встановіть **Git for Windows** і переконайтеся, що `git` є у вашому PATH.
    - Закрийте й знову відкрийте PowerShell, а потім повторно запустіть інсталятор.

    **2) openclaw не розпізнається після встановлення**

    - Ваша глобальна папка npm bin не входить до PATH.
    - Перевірте шлях:

      ```powershell
      npm config get prefix
      ```

    - Додайте цей каталог до PATH вашого користувача (у Windows суфікс `\bin` не потрібен; на більшості систем це `%AppData%\npm`).
    - Закрийте й знову відкрийте PowerShell після оновлення PATH.

    Якщо вам потрібне найплавніше налаштування Windows, використовуйте **WSL2** замість нативної Windows.
    Документація: [Windows](/uk/platforms/windows).

  </Accordion>

  <Accordion title="Вивід exec у Windows показує спотворений китайський текст — що робити?">
    Зазвичай це невідповідність кодової сторінки консолі в нативних оболонках Windows.

    Симптоми:

    - вивід `system.run`/`exec` показує китайську як mojibake
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

    Якщо ви все ще можете відтворити це в останній версії OpenClaw, відстежуйте/повідомте про це тут:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Документація не відповіла на моє запитання — як отримати кращу відповідь?">
    Використовуйте **змінюване (git) встановлення**, щоб мати повний вихідний код і документацію локально, а потім запитайте
    свого бота (або Claude/Codex) _з цієї папки_, щоб він міг прочитати репозиторій і відповісти точно.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Докладніше: [Встановлення](/uk/install) і [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Як встановити OpenClaw на Linux?">
    Коротко: дотримуйтеся посібника для Linux, потім запустіть onboarding.

    - Швидкий шлях для Linux + встановлення сервісу: [Linux](/uk/platforms/linux).
    - Повний покроковий посібник: [Початок роботи](/uk/start/getting-started).
    - Інсталятор + оновлення: [Встановлення й оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Як встановити OpenClaw на VPS?">
    Підійде будь-який Linux VPS. Встановіть на сервері, а потім використовуйте SSH/Tailscale, щоб дістатися до Gateway.

    Посібники: [exe.dev](/uk/install/exe-dev), [Hetzner](/uk/install/hetzner), [Fly.io](/uk/install/fly).
    Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де посібники зі встановлення у хмарі/VPS?">
    Ми підтримуємо **хаб хостингу** з поширеними провайдерами. Виберіть один і дотримуйтеся посібника:

    - [VPS-хостинг](/uk/vps) (усі провайдери в одному місці)
    - [Fly.io](/uk/install/fly)
    - [Hetzner](/uk/install/hetzner)
    - [exe.dev](/uk/install/exe-dev)

    Як це працює в хмарі: **Gateway працює на сервері**, а ви отримуєте доступ
    із ноутбука/телефона через Control UI (або Tailscale/SSH). Ваш стан + робочий простір
    зберігаються на сервері, тому вважайте хост джерелом істини й робіть резервні копії.

    Ви можете спарити **вузли** (Mac/iOS/Android/headless) із цим хмарним Gateway, щоб отримувати доступ
    до локального екрана/камери/полотна або виконувати команди на своєму ноутбуці, залишаючи
    Gateway у хмарі.

    Хаб: [Платформи](/uk/platforms). Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).
    Вузли: [Вузли](/uk/nodes), [CLI вузлів](/uk/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я попросити OpenClaw оновити себе?">
    Коротко: **можливо, але не рекомендовано**. Потік оновлення може перезапустити
    Gateway (що розриває активний сеанс), може потребувати чистого git checkout і
    може попросити підтвердження. Безпечніше: запускайте оновлення з оболонки як оператор.

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

  <Accordion title="Що насправді робить onboarding?">
    `openclaw onboard` — рекомендований шлях налаштування. У **локальному режимі** він проводить вас через:

    - **Налаштування моделі/автентифікації** (OAuth провайдера, API-ключі, Anthropic setup-token, а також варіанти локальних моделей, як-от LM Studio)
    - Розташування **робочого простору** + початкові файли
    - **Налаштування Gateway** (bind/port/auth/tailscale)
    - **Канали** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, а також вбудовані channel plugins, як-от QQ Bot)
    - **Встановлення демона** (LaunchAgent на macOS; systemd user unit на Linux/WSL2)
    - **Перевірки стану** і вибір **skills**

    Він також попереджає, якщо налаштована модель невідома або не має автентифікації.

  </Accordion>

  <Accordion title="Чи потрібна мені підписка Claude або OpenAI, щоб це запускати?">
    Ні. Ви можете запускати OpenClaw з **API-ключами** (Anthropic/OpenAI/інші) або з
    **лише локальними моделями**, щоб ваші дані залишалися на вашому пристрої. Підписки (Claude
    Pro/Max або OpenAI Codex) — це необов’язкові способи автентифікації цих провайдерів.

    Для Anthropic в OpenClaw практичний поділ такий:

    - **API-ключ Anthropic**: звичайна оплата Anthropic API
    - **Claude CLI / автентифікація підписки Claude в OpenClaw**: співробітники Anthropic
      повідомили нам, що таке використання знову дозволене, і OpenClaw розглядає використання `claude -p`
      як санкціоноване для цієї інтеграції, якщо Anthropic не опублікує нову
      політику

    Для довготривалих gateway-хостів API-ключі Anthropic все ще є більш
    передбачуваним налаштуванням. OpenAI Codex OAuth явно підтримується для зовнішніх
    інструментів, таких як OpenClaw.

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
    OpenClaw розглядає автентифікацію підписки Claude і використання `claude -p` як санкціоновані
    для цієї інтеграції, якщо Anthropic не опублікує нову політику. Якщо вам потрібне
    найбільш передбачуване серверне налаштування, натомість використовуйте API-ключ Anthropic.

  </Accordion>

  <Accordion title="Чи підтримується автентифікація підписки Claude (Claude Pro або Max)?">
    Так.

    Співробітники Anthropic повідомили нам, що таке використання знову дозволене, тому OpenClaw розглядає
    повторне використання Claude CLI і використання `claude -p` як санкціоновані для цієї інтеграції
    якщо Anthropic не опублікує нову політику.

    Anthropic setup-token все ще доступний як підтримуваний шлях токена OpenClaw, але OpenClaw тепер віддає перевагу повторному використанню Claude CLI і `claude -p`, коли вони доступні.
    Для виробничих або багатокористувацьких навантажень автентифікація API-ключем Anthropic все ще є
    безпечнішим і передбачуванішим вибором. Якщо вам потрібні інші розміщені
    варіанти у стилі підписки в OpenClaw, дивіться [OpenAI](/uk/providers/openai), [Qwen / Model
    Cloud](/uk/providers/qwen), [MiniMax](/uk/providers/minimax) і [GLM
    Models](/uk/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Чому я бачу HTTP 429 rate_limit_error від Anthropic?">
    Це означає, що ваша **квота/ліміт частоти Anthropic** вичерпано для поточного вікна. Якщо ви
    використовуєте **Claude CLI**, зачекайте, доки вікно скинеться, або оновіть свій план. Якщо ви
    використовуєте **API-ключ Anthropic**, перевірте Anthropic Console
    щодо використання/оплати й за потреби підніміть ліміти.

    Якщо повідомлення саме таке:
    `Extra usage is required for long context requests`, запит намагається використати
    Anthropic 1M context beta (`context1m: true`). Це працює лише тоді, коли ваші
    облікові дані придатні для тарифікації довгого контексту (тарифікація API-ключа або
    шлях входу OpenClaw Claude з увімкненим Extra Usage).

    Порада: задайте **резервну модель**, щоб OpenClaw міг продовжувати відповідати, коли провайдер має обмеження частоти.
    Див. [Моделі](/uk/cli/models), [OAuth](/uk/concepts/oauth) і
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/uk/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Чи підтримується AWS Bedrock?">
    Так. OpenClaw має вбудованого провайдера **Amazon Bedrock (Converse)**. Коли наявні маркери середовища AWS, OpenClaw може автоматично виявити потоковий/текстовий каталог Bedrock і об’єднати його як неявного провайдера `amazon-bedrock`; інакше ви можете явно ввімкнути `plugins.entries.amazon-bedrock.config.discovery.enabled` або додати запис провайдера вручну. Див. [Amazon Bedrock](/uk/providers/bedrock) і [Провайдери моделей](/uk/providers/models). Якщо ви віддаєте перевагу керованому потоку ключів, OpenAI-сумісний проксі перед Bedrock також залишається допустимим варіантом.
  </Accordion>

  <Accordion title="Як працює автентифікація Codex?">
    OpenClaw підтримує **OpenAI Code (Codex)** через OAuth (вхід ChatGPT). Використовуйте
    `openai/gpt-5.5` для типового налаштування: автентифікація підписки ChatGPT/Codex плюс
    нативне виконання сервера застосунку Codex. Посилання на моделі `openai-codex/gpt-*` є
    застарілою конфігурацією, яку виправляє `openclaw doctor --fix`. Прямий доступ через
    API-ключ OpenAI залишається доступним для неагентних поверхонь OpenAI API і для агентних
    моделей через упорядкований профіль API-ключа `openai-codex`.
    Див. [Провайдери моделей](/uk/concepts/model-providers) і [Онбординг (CLI)](/uk/start/wizard).
  </Accordion>

  <Accordion title="Чому OpenClaw досі згадує openai-codex?">
    `openai-codex` — це ідентифікатор провайдера та профілю автентифікації для ChatGPT/Codex OAuth.
    Старіші конфігурації також використовували його як префікс моделі:

    - `openai/gpt-5.5` = автентифікація підписки ChatGPT/Codex із нативним runtime Codex для агентних ходів
    - `openai-codex/gpt-5.5` = застарілий маршрут моделі, який виправляє `openclaw doctor --fix`
    - `openai/gpt-5.5` плюс упорядкований профіль API-ключа `openai-codex` = автентифікація API-ключем для агентної моделі OpenAI
    - `openai-codex:...` = ідентифікатор профілю автентифікації, а не посилання на модель

    Якщо вам потрібен прямий шлях тарифікації/лімітів OpenAI Platform, задайте
    `OPENAI_API_KEY`. Якщо вам потрібна автентифікація підписки ChatGPT/Codex, увійдіть через
    `openclaw models auth login --provider openai-codex`. Залишайте посилання на модель як
    `openai/gpt-5.5`; посилання на моделі `openai-codex/*` — це застаріла конфігурація, яку
    `openclaw doctor --fix` переписує.

  </Accordion>

  <Accordion title="Чому ліміти Codex OAuth можуть відрізнятися від ChatGPT web?">
    Codex OAuth використовує керовані OpenAI, залежні від плану вікна квот. На практиці
    ці ліміти можуть відрізнятися від досвіду на сайті/в застосунку ChatGPT, навіть коли
    обидва прив’язані до того самого облікового запису.

    OpenClaw може показувати поточно видимі вікна використання/квот провайдера в
    `openclaw models status`, але він не вигадує й не нормалізує права ChatGPT-web
    у прямий API-доступ. Якщо вам потрібен прямий шлях тарифікації/лімітів OpenAI Platform,
    використовуйте `openai/*` з API-ключем.

  </Accordion>

  <Accordion title="Чи підтримуєте ви автентифікацію підписки OpenAI (Codex OAuth)?">
    Так. OpenClaw повністю підтримує **OpenAI Code (Codex) subscription OAuth**.
    OpenAI явно дозволяє використання subscription OAuth у зовнішніх інструментах/робочих процесах
    на кшталт OpenClaw. Онбординг може виконати потік OAuth за вас.

    Див. [OAuth](/uk/concepts/oauth), [Провайдери моделей](/uk/concepts/model-providers) і [Онбординг (CLI)](/uk/start/wizard).

  </Accordion>

  <Accordion title="Як налаштувати Gemini CLI OAuth?">
    Gemini CLI використовує **потік автентифікації Plugin**, а не ідентифікатор клієнта чи секрет у `openclaw.json`.

    Кроки:

    1. Установіть Gemini CLI локально, щоб `gemini` був у `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Увімкніть Plugin: `openclaw plugins enable google`
    3. Увійдіть: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Модель за замовчуванням після входу: `google-gemini-cli/gemini-3-flash-preview`
    5. Якщо запити не виконуються, задайте `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості Gateway

    Це зберігає токени OAuth у профілях автентифікації на хості Gateway. Подробиці: [Провайдери моделей](/uk/concepts/model-providers).

  </Accordion>

  <Accordion title="Чи підходить локальна модель для невимушених чатів?">
    Зазвичай ні. OpenClaw потребує великого контексту + сильної безпеки; невеликі карти обрізають і пропускають дані. Якщо мусите, запускайте **найбільшу** збірку моделі, яку можете локально (LM Studio), і див. [/gateway/local-models](/uk/gateway/local-models). Менші/квантовані моделі підвищують ризик prompt injection — див. [Безпека](/uk/gateway/security).
  </Accordion>

  <Accordion title="Як утримувати трафік розміщених моделей у певному регіоні?">
    Вибирайте прив’язані до регіону кінцеві точки. OpenRouter надає варіанти з хостингом у США для MiniMax, Kimi та GLM; виберіть варіант із хостингом у США, щоб утримувати дані в регіоні. Ви все ще можете вказати Anthropic/OpenAI поряд із ними, використовуючи `models.mode: "merge"`, щоб резервні варіанти залишалися доступними з дотриманням вибраного регіонального провайдера.
  </Accordion>

  <Accordion title="Чи потрібно купувати Mac Mini, щоб це встановити?">
    Ні. OpenClaw працює на macOS або Linux (Windows через WSL2). Mac mini необов’язковий — деякі люди
    купують його як постійно ввімкнений хост, але невеликий VPS, домашній сервер або пристрій класу Raspberry Pi також підходить.

    Mac потрібен лише **для інструментів, що працюють тільки на macOS**. Для iMessage використовуйте [iMessage](/uk/channels/imessage) з `imsg` на будь-якому Mac, де виконано вхід у Messages. Якщо Gateway працює на Linux або деінде, задайте `channels.imessage.cliPath` як SSH-обгортку, що запускає `imsg` на тому Mac. Якщо вам потрібні інші інструменти лише для macOS, запускайте Gateway на Mac або під’єднайте macOS-вузол.

    Документація: [iMessage](/uk/channels/imessage), [Nodes](/uk/nodes), [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи потрібен Mac mini для підтримки iMessage?">
    Вам потрібен **якийсь пристрій macOS** із виконаним входом у Messages. Це **не** обов’язково має бути Mac mini —
    підійде будь-який Mac. **Використовуйте [iMessage](/uk/channels/imessage)** з `imsg`; Gateway може працювати на цьому Mac або деінде з SSH-обгорткою `cliPath`.

    Типові налаштування:

    - Запустіть Gateway на Linux/VPS і задайте `channels.imessage.cliPath` як SSH-обгортку, що запускає `imsg` на Mac із виконаним входом у Messages.
    - Запустіть усе на Mac, якщо хочете найпростіше налаштування на одному комп’ютері.

    Документація: [iMessage](/uk/channels/imessage), [Nodes](/uk/nodes),
    [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Якщо я куплю Mac mini для запуску OpenClaw, чи можу під’єднати його до свого MacBook Pro?">
    Так. **Mac mini може запускати Gateway**, а ваш MacBook Pro може під’єднуватися як
    **вузол** (супровідний пристрій). Вузли не запускають Gateway — вони надають додаткові
    можливості, як-от екран/камера/полотно та `system.run` на цьому пристрої.

    Типовий шаблон:

    - Gateway на Mac mini (постійно ввімкнений).
    - MacBook Pro запускає застосунок macOS або хост вузла й під’єднується до Gateway.
    - Використовуйте `openclaw nodes status` / `openclaw nodes list`, щоб побачити його.

    Документація: [Nodes](/uk/nodes), [CLI вузлів](/uk/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я використовувати Bun?">
    Bun **не рекомендується**. Ми бачимо помилки runtime, особливо з WhatsApp і Telegram.
    Використовуйте **Node** для стабільних Gateway.

    Якщо ви все ж хочете поекспериментувати з Bun, робіть це на не production Gateway
    без WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: що вказувати в allowFrom?">
    `channels.telegram.allowFrom` — це **ID користувача Telegram людського відправника** (числовий). Це не ім’я користувача бота.

    Налаштування просить лише числові ID користувачів. Якщо у вас уже є застарілі записи `@username` у конфігурації, `openclaw doctor --fix` може спробувати їх зіставити.

    Безпечніше (без стороннього бота):

    - Напишіть своєму боту в DM, потім запустіть `openclaw logs --follow` і прочитайте `from.id`.

    Офіційний Bot API:

    - Напишіть своєму боту в DM, потім викличте `https://api.telegram.org/bot<bot_token>/getUpdates` і прочитайте `message.from.id`.

    Сторонні сервіси (менш приватно):

    - Напишіть у DM `@userinfobot` або `@getidsbot`.

    Див. [/channels/telegram](/uk/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Чи можуть кілька людей використовувати один номер WhatsApp з різними екземплярами OpenClaw?">
    Так, через **маршрутизацію кількох агентів**. Прив’яжіть **DM** WhatsApp кожного відправника (peer `kind: "direct"`, відправник E.164 на кшталт `+15551234567`) до іншого `agentId`, щоб кожна людина отримала власний workspace і сховище сесій. Відповіді все одно надходять із **того самого облікового запису WhatsApp**, а контроль доступу DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) є глобальним для кожного облікового запису WhatsApp. Див. [Маршрутизація кількох агентів](/uk/concepts/multi-agent) і [WhatsApp](/uk/channels/whatsapp).
  </Accordion>

  <Accordion title='Чи можу я запустити агента "fast chat" і агента "Opus for coding"?'>
    Так. Використовуйте маршрутизацію кількох агентів: задайте кожному агенту власну модель за замовчуванням, потім прив’яжіть вхідні маршрути (обліковий запис провайдера або конкретних peer) до кожного агента. Приклад конфігурації є в [Маршрутизації кількох агентів](/uk/concepts/multi-agent). Див. також [Моделі](/uk/concepts/models) і [Конфігурація](/uk/gateway/configuration).
  </Accordion>

  <Accordion title="Чи працює Homebrew на Linux?">
    Так. Homebrew підтримує Linux (Linuxbrew). Швидке налаштування:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Якщо ви запускаєте OpenClaw через systemd, переконайтеся, що PATH сервісу містить `/home/linuxbrew/.linuxbrew/bin` (або ваш префікс brew), щоб інструменти, встановлені через `brew`, знаходилися в неінтерактивних оболонках.
    Нещодавні збірки також додають на початок поширені користувацькі bin-каталоги в сервісах Linux systemd (наприклад `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) і враховують `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` і `FNM_DIR`, коли їх задано.

  </Accordion>

  <Accordion title="Різниця між hackable встановленням із git і встановленням через npm">
    - **Hackable (git) встановлення:** повний checkout вихідного коду, редагований, найкраще для контриб’юторів.
      Ви запускаєте збірки локально й можете виправляти код/документацію.
    - **Встановлення через npm:** глобальне встановлення CLI, без репозиторію, найкраще для "просто запустити".
      Оновлення надходять із dist-tags npm.

    Документація: [Початок роботи](/uk/start/getting-started), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Чи можу я пізніше перемикатися між встановленнями npm і git?">
    Так. Використовуйте `openclaw update --channel ...`, коли OpenClaw уже встановлено.
    Це **не видаляє ваші дані** — це змінює лише встановлення коду OpenClaw.
    Ваш стан (`~/.openclaw`) і workspace (`~/.openclaw/workspace`) залишаються недоторканими.

    З npm на git:

    ```bash
    openclaw update --channel dev
    ```

    З git на npm:

    ```bash
    openclaw update --channel stable
    ```

    Додайте `--dry-run`, щоб спочатку переглянути заплановане перемикання режиму. Засіб оновлення запускає
    подальші дії Doctor, оновлює джерела Plugin для цільового каналу та
    перезапускає Gateway, якщо ви не передасте `--no-restart`.

    Інсталятор також може примусово вибрати будь-який режим:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Поради щодо резервного копіювання: див. [Стратегія резервного копіювання](/uk/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Чи варто запускати Gateway на ноутбуці чи VPS?">
    Коротка відповідь: **якщо вам потрібна надійність 24/7, використовуйте VPS**. Якщо вам потрібен
    найменший поріг входу і вас влаштовують сон/перезапуски, запускайте його локально.

    **Ноутбук (локальний Gateway)**

    - **Переваги:** немає витрат на сервер, прямий доступ до локальних файлів, активне вікно браузера.
    - **Недоліки:** сон/збої мережі = роз'єднання, оновлення ОС/перезавантаження переривають роботу, має залишатися активним.

    **VPS / хмара**

    - **Переваги:** завжди ввімкнений, стабільна мережа, немає проблем зі сном ноутбука, легше підтримувати роботу.
    - **Недоліки:** часто працює без графічного інтерфейсу (використовуйте знімки екрана), лише віддалений доступ до файлів, для оновлень потрібно використовувати SSH.

    **Примітка щодо OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord добре працюють із VPS. Єдиний реальний компроміс — **браузер без графічного інтерфейсу** проти видимого вікна. Див. [Браузер](/uk/tools/browser).

    **Рекомендоване значення за замовчуванням:** VPS, якщо раніше у вас були роз'єднання gateway. Локальний запуск добре підходить, коли ви активно використовуєте Mac і хочете мати доступ до локальних файлів або автоматизацію UI з видимим браузером.

  </Accordion>

  <Accordion title="Наскільки важливо запускати OpenClaw на виділеній машині?">
    Не обов'язково, але **рекомендовано для надійності та ізоляції**.

    - **Виділений хост (VPS/Mac mini/Pi):** завжди ввімкнений, менше переривань через сон/перезавантаження, чистіші дозволи, легше підтримувати роботу.
    - **Спільний ноутбук/настільний комп'ютер:** цілком підходить для тестування й активного використання, але очікуйте пауз, коли машина переходить у сон або оновлюється.

    Якщо хочете отримати найкраще з обох варіантів, тримайте Gateway на виділеному хості й під'єднайте ноутбук як **node** для локальних інструментів екрана/камери/exec. Див. [Вузли](/uk/nodes).
    Для рекомендацій із безпеки прочитайте [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які мінімальні вимоги до VPS і рекомендована ОС?">
    OpenClaw невибагливий до ресурсів. Для базового Gateway + одного каналу чату:

    - **Абсолютний мінімум:** 1 vCPU, 1GB RAM, ~500MB диска.
    - **Рекомендовано:** 1-2 vCPU, 2GB RAM або більше для запасу (журнали, медіа, кілька каналів). Інструменти Node та автоматизація браузера можуть вимагати багато ресурсів.

    ОС: використовуйте **Ubuntu LTS** (або будь-який сучасний Debian/Ubuntu). Шлях встановлення Linux найкраще протестований там.

    Документація: [Linux](/uk/platforms/linux), [хостинг VPS](/uk/vps).

  </Accordion>

  <Accordion title="Чи можна запускати OpenClaw у VM і які вимоги?">
    Так. Ставтеся до VM так само, як до VPS: вона має бути завжди ввімкнена, доступна і мати достатньо
    RAM для Gateway та будь-яких каналів, які ви вмикаєте.

    Базові рекомендації:

    - **Абсолютний мінімум:** 1 vCPU, 1GB RAM.
    - **Рекомендовано:** 2GB RAM або більше, якщо ви запускаєте кілька каналів, автоматизацію браузера або медіаінструменти.
    - **ОС:** Ubuntu LTS або інший сучасний Debian/Ubuntu.

    Якщо ви на Windows, **WSL2 — найпростіший варіант налаштування у стилі VM** і має найкращу
    сумісність інструментів. Див. [Windows](/uk/platforms/windows), [хостинг VPS](/uk/vps).
    Якщо ви запускаєте macOS у VM, див. [macOS VM](/uk/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Пов'язані матеріали

- [FAQ](/uk/help/faq) — головний FAQ (моделі, сесії, gateway, безпека тощо)
- [Огляд встановлення](/uk/install)
- [Початок роботи](/uk/start/getting-started)
- [Усунення несправностей](/uk/help/troubleshooting)
