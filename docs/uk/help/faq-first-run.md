---
read_when:
    - Нове встановлення, зависання онбордингу або помилки під час першого запуску
    - Вибір автентифікації та підписок провайдера
    - Не вдається отримати доступ до docs.openclaw.ai, не вдається відкрити панель керування, встановлення зависло
sidebarTitle: First-run FAQ
summary: 'ЧаПи: швидкий старт і початкове налаштування — встановлення, онбординг, автентифікація, підписки, початкові збої'
title: 'ЧаПи: початкове налаштування'
x-i18n:
    generated_at: "2026-04-26T08:50:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55d375285eb9f79cfa210b1b591b07b57d8a0a4d38c330062886d1204135ff48
    source_path: help/faq-first-run.md
    workflow: 15
---

  ЧаПи про швидкий старт і перший запуск. Для щоденних операцій, моделей, автентифікації, сесій
  і усунення несправностей дивіться основні [ЧаПи](/uk/help/faq).

  ## Швидкий старт і початкове налаштування

  <AccordionGroup>
  <Accordion title="Я застряг, який найшвидший спосіб розібратися">
    Використовуйте локального AI-агента, який може **бачити вашу машину**. Це значно ефективніше, ніж запитувати
    у Discord, тому що більшість випадків "я застряг" — це **проблеми локальної конфігурації або середовища**,
    які віддалені помічники не можуть перевірити.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Ці інструменти можуть читати репозиторій, запускати команди, перевіряти журнали й допомагати виправляти
    налаштування на рівні машини (PATH, служби, дозволи, файли автентифікації). Надайте їм **повну вихідну копію репозиторію**
    через hackable (git) встановлення:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це встановлює OpenClaw **із git checkout**, тож агент може читати код і документацію
    та аналізувати точну версію, яку ви запускаєте. Пізніше ви завжди можете повернутися до стабільної версії,
    повторно запустивши інсталятор без `--install-method git`.

    Порада: попросіть агента **спланувати й супроводжувати** виправлення (крок за кроком), а потім виконати лише
    потрібні команди. Так зміни залишаються невеликими й їх легше перевіряти.

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

    Швидкий цикл налагодження: [Перші 60 секунд, якщо щось зламано](#first-60-seconds-if-something-is-broken).
    Документація зі встановлення: [Встановлення](/uk/install), [Прапорці інсталятора](/uk/install/installer), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Heartbeat постійно пропускається. Що означають причини пропуску?">
    Поширені причини пропуску Heartbeat:

    - `quiet-hours`: поза налаштованим вікном active-hours
    - `empty-heartbeat-file`: `HEARTBEAT.md` існує, але містить лише порожній шаблон або лише заголовки
    - `no-tasks-due`: режим завдань `HEARTBEAT.md` активний, але жоден з інтервалів завдань ще не настав
    - `alerts-disabled`: усю видимість heartbeat вимкнено (`showOk`, `showAlerts` і `useIndicator` усі вимкнені)

    У режимі завдань часові позначки настання оновлюються лише після завершення справжнього запуску heartbeat.
    Пропущені запуски не позначають завдання як виконані.

    Документація: [Heartbeat](/uk/gateway/heartbeat), [Автоматизація й завдання](/uk/automation).

  </Accordion>

  <Accordion title="Рекомендований спосіб встановити й налаштувати OpenClaw">
    Репозиторій рекомендує запуск із вихідного коду та використання онбордингу:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Майстер також може автоматично зібрати ресурси UI. Після онбордингу зазвичай Gateway працює на порту **18789**.

    Із вихідного коду (для контриб'юторів/розробників):

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

  <Accordion title="Як відкрити панель керування після онбордингу?">
    Майстер відкриває ваш браузер із чистою (без токена) URL-адресою панелі керування відразу після онбордингу, а також виводить посилання в підсумку. Залиште цю вкладку відкритою; якщо вона не запустилася, скопіюйте та вставте надруковану URL-адресу на тій самій машині.
  </Accordion>

  <Accordion title="Як автентифікувати панель керування на localhost і віддалено?">
    **Localhost (та сама машина):**

    - Відкрийте `http://127.0.0.1:18789/`.
    - Якщо запитується автентифікація спільним секретом, вставте налаштований токен або пароль у параметри Control UI.
    - Джерело токена: `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`).
    - Джерело пароля: `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо спільний секрет ще не налаштовано, згенеруйте токен за допомогою `openclaw doctor --generate-gateway-token`.

    **Не на localhost:**

    - **Tailscale Serve** (рекомендовано): залиште bind loopback, запустіть `openclaw gateway --tailscale serve`, відкрийте `https://<magicdns>/`. Якщо `gateway.auth.allowTailscale` має значення `true`, заголовки ідентичності задовольняють автентифікацію Control UI/WebSocket (без вставлення спільного секрету, за умови довіреного хоста Gateway); HTTP API все одно вимагають автентифікації спільним секретом, якщо ви свідомо не використовуєте private-ingress `none` або HTTP-автентифікацію trusted-proxy.
      Невдалі одночасні спроби автентифікації Serve від того самого клієнта серіалізуються до того, як лімітер невдалих автентифікацій зафіксує їх, тому друга невдала повторна спроба вже може показати `retry later`.
    - **Прив'язка до tailnet**: запустіть `openclaw gateway --bind tailnet --token "<token>"` (або налаштуйте автентифікацію паролем), відкрийте `http://<tailscale-ip>:18789/`, потім вставте відповідний спільний секрет у параметри панелі керування.
    - **Reverse proxy з перевіркою ідентичності**: залиште Gateway за trusted proxy без loopback, налаштуйте `gateway.auth.mode: "trusted-proxy"`, потім відкрийте URL proxy.
    - **SSH-тунель**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, потім відкрийте `http://127.0.0.1:18789/`. Автентифікація спільним секретом усе одно застосовується через тунель; якщо буде запит, вставте налаштований токен або пароль.

    Дивіться [Панель керування](/uk/web/dashboard) і [Веб-поверхні](/uk/web) для деталей про режими bind та автентифікацію.

  </Accordion>

  <Accordion title="Чому для погоджень чату є дві конфігурації погодження exec?">
    Вони керують різними рівнями:

    - `approvals.exec`: пересилає запити на погодження до чат-призначень
    - `channels.<channel>.execApprovals`: робить цей канал нативним клієнтом погодження для exec-погоджень

    Політика host exec усе одно є справжнім механізмом погодження. Конфігурація чату лише керує тим,
    де з'являються запити на погодження і як люди можуть на них відповідати.

    У більшості конфігурацій вам **не** потрібні обидві:

    - Якщо чат уже підтримує команди та відповіді, `/approve` у тому самому чаті працює через спільний шлях.
    - Якщо підтримуваний нативний канал може безпечно визначати погоджувачів, OpenClaw тепер автоматично вмикає нативні погодження з пріоритетом DM, коли `channels.<channel>.execApprovals.enabled` не задано або має значення `"auto"`.
    - Коли доступні нативні картки/кнопки погодження, цей нативний UI є основним шляхом; агент повинен включати ручну команду `/approve`, лише якщо результат інструмента каже, що погодження через чат недоступні або ручне погодження — єдиний шлях.
    - Використовуйте `approvals.exec` лише тоді, коли запити також потрібно пересилати в інші чати або явні кімнати для ops.
    - Використовуйте `channels.<channel>.execApprovals.target: "channel"` або `"both"` лише тоді, коли ви явно хочете, щоб запити на погодження надсилалися назад у вихідну кімнату/тему.
    - Погодження Plugin — це ще окрема категорія: вони типово використовують `/approve` у тому самому чаті, необов'язкове пересилання `approvals.plugin`, і лише деякі нативні канали додатково залишають нативну обробку plugin-погоджень зверху.

    Коротко: пересилання — для маршрутизації, конфігурація нативного клієнта — для багатшого UX, специфічного для каналу.
    Дивіться [Exec Approvals](/uk/tools/exec-approvals).

  </Accordion>

  <Accordion title="Яке середовище виконання мені потрібне?">
    Потрібен Node **>= 22**. Рекомендовано `pnpm`. Bun **не рекомендований** для Gateway.
  </Accordion>

  <Accordion title="Чи працює це на Raspberry Pi?">
    Так. Gateway легковаговий — у документації зазначено, що для особистого використання достатньо **512MB-1GB RAM**, **1 ядра** і приблизно **500MB**
    диска, а також що **Raspberry Pi 4 може це запускати**.

    Якщо вам потрібен додатковий запас (журнали, медіа, інші служби), рекомендовано **2GB**, але це
    не жорсткий мінімум.

    Порада: невеликий Pi/VPS може хостити Gateway, а ви можете підключати **nodes** на своєму ноутбуці/телефоні для
    локального екрана/камери/canvas або виконання команд. Дивіться [Nodes](/uk/nodes).

  </Accordion>

  <Accordion title="Є поради щодо встановлення на Raspberry Pi?">
    Коротко: це працює, але очікуйте шорсткостей.

    - Використовуйте **64-bit** ОС і тримайте Node >= 22.
    - Віддавайте перевагу **hackable (git) install**, щоб ви могли бачити журнали та швидко оновлюватися.
    - Починайте без каналів/Skills, потім додавайте їх по одному.
    - Якщо стикаєтеся з дивними проблемами бінарних файлів, зазвичай це проблема **сумісності ARM**.

    Документація: [Linux](/uk/platforms/linux), [Встановлення](/uk/install).

  </Accordion>

  <Accordion title="Застрягає на wake up my friend / онбординг не проходить. Що робити?">
    Цей екран залежить від того, чи доступний Gateway і чи пройдена автентифікація. TUI також надсилає
    "Wake up, my friend!" автоматично під час першого hatch. Якщо ви бачите цей рядок **без відповіді**
    і токени залишаються на 0, агент так і не запустився.

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

    3. Якщо все одно зависає, виконайте:

    ```bash
    openclaw doctor
    ```

    Якщо Gateway віддалений, переконайтеся, що тунель/з'єднання Tailscale активне і що UI
    вказує на правильний Gateway. Дивіться [Віддалений доступ](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Чи можу я перенести своє налаштування на нову машину (Mac mini), не проходячи онбординг заново?">
    Так. Скопіюйте **каталог стану** та **робочий простір**, потім один раз запустіть Doctor. Це
    збереже вашого бота "точно таким самим" (пам'ять, історію сесій, автентифікацію та стан
    каналу), якщо ви скопіюєте **обидва** розташування:

    1. Встановіть OpenClaw на новій машині.
    2. Скопіюйте `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`) зі старої машини.
    3. Скопіюйте свій робочий простір (типово: `~/.openclaw/workspace`).
    4. Запустіть `openclaw doctor` і перезапустіть службу Gateway.

    Це збереже конфігурацію, профілі автентифікації, облікові дані WhatsApp, сесії та пам'ять. Якщо ви в
    віддаленому режимі, пам'ятайте, що хост gateway володіє сховищем сесій і робочим простором.

    **Важливо:** якщо ви лише commit/push свій робочий простір на GitHub, ви створюєте резервну
    копію **пам'яті + bootstrap-файлів**, але **не** історії сесій або автентифікації. Вони живуть
    у `~/.openclaw/` (наприклад, `~/.openclaw/agents/<agentId>/sessions/`).

    Пов'язане: [Міграція](/uk/install/migrating), [Де що зберігається на диску](#where-things-live-on-disk),
    [Робочий простір агента](/uk/concepts/agent-workspace), [Doctor](/uk/gateway/doctor),
    [Віддалений режим](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де подивитися, що нового в останній версії?">
    Перевірте changelog на GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Найновіші записи — зверху. Якщо верхній розділ позначено як **Unreleased**, наступний датований
    розділ є останньою випущеною версією. Записи згруповано за **Highlights**, **Changes** і
    **Fixes** (а також за документацією/іншими розділами за потреби).

  </Accordion>

  <Accordion title="Не вдається отримати доступ до docs.openclaw.ai (помилка SSL)">
    Деякі підключення Comcast/Xfinity помилково блокують `docs.openclaw.ai` через Xfinity
    Advanced Security. Вимкніть його або додайте `docs.openclaw.ai` до allowlist, а потім повторіть спробу.
    Будь ласка, допоможіть нам розблокувати це, повідомивши тут: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Якщо ви все ще не можете отримати доступ до сайту, документація дзеркалюється на GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Різниця між stable і beta">
    **Stable** і **beta** — це **npm dist-tags**, а не окремі гілки коду:

    - `latest` = stable
    - `beta` = рання збірка для тестування

    Зазвичай стабільний реліз спочатку потрапляє в **beta**, а потім окремий
    крок просування переміщує ту саму версію в `latest`. За потреби мейнтейнери також можуть
    публікувати відразу в `latest`. Тому після просування beta і stable можуть
    вказувати на **одну й ту саму версію**.

    Подивитися, що змінилося:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Щоб переглянути однорядкові команди встановлення та різницю між beta і dev, дивіться accordion нижче.

  </Accordion>

  <Accordion title="Як установити beta-версію і в чому різниця між beta та dev?">
    **Beta** — це npm dist-tag `beta` (може збігатися з `latest` після просування).
    **Dev** — це рухома голова `main` (git); коли її публікують, вона використовує npm dist-tag `dev`.

    Однорядкові команди (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Інсталятор для Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Докладніше: [Канали розробки](/uk/install/development-channels) і [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Як спробувати найсвіжіші збірки?">
    Є два варіанти:

    1. **Канал dev (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Це перемикає на гілку `main` та оновлює з вихідного коду.

    2. **Hackable install (із сайту інсталятора):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це дає вам локальний репозиторій, який можна редагувати, а потім оновлювати через git.

    Якщо ви віддаєте перевагу чистому клонуванню вручну, використовуйте:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Документація: [Оновлення](/uk/cli/update), [Канали розробки](/uk/install/development-channels),
    [Встановлення](/uk/install).

  </Accordion>

  <Accordion title="Скільки зазвичай триває встановлення та онбординг?">
    Орієнтовно:

    - **Встановлення:** 2–5 хвилин
    - **Онбординг:** 5–15 хвилин залежно від того, скільки каналів/моделей ви налаштовуєте

    Якщо все зависає, скористайтеся [Installer stuck](#quick-start-and-first-run-setup)
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

    Для hackable (git) install:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Еквівалент для Windows (PowerShell):

    ```powershell
    # install.ps1 ще не має окремого прапорця -Verbose.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Більше варіантів: [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Під час встановлення у Windows пише git not found або openclaw not recognized">
    Дві поширені проблеми у Windows:

    **1) npm error spawn git / git not found**

    - Установіть **Git for Windows** і переконайтеся, що `git` є у вашому PATH.
    - Закрийте й знову відкрийте PowerShell, потім повторно запустіть інсталятор.

    **2) openclaw is not recognized after install**

    - Глобальна тека bin npm не є у PATH.
    - Перевірте шлях:

      ```powershell
      npm config get prefix
      ```

    - Додайте цей каталог до свого користувацького PATH (суфікс `\bin` у Windows не потрібен; на більшості систем це `%AppData%\npm`).
    - Закрийте й знову відкрийте PowerShell після оновлення PATH.

    Якщо вам потрібне найплавніше налаштування у Windows, використовуйте **WSL2** замість нативної Windows.
    Документація: [Windows](/uk/platforms/windows).

  </Accordion>

  <Accordion title="У Windows вивід exec показує спотворений китайський текст — що робити?">
    Зазвичай це невідповідність кодової сторінки консолі в нативних оболонках Windows.

    Симптоми:

    - Вивід `system.run`/`exec` відображає китайський текст як mojibake
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

    Якщо це все ще відтворюється в останній версії OpenClaw, відстежуйте/повідомляйте тут:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Документація не відповіла на моє запитання — як отримати кращу відповідь?">
    Використовуйте **hackable (git) install**, щоб повністю мати локально вихідний код і документацію, а потім запитайте
    свого бота (або Claude/Codex) _з цієї теки_, щоб він міг читати репозиторій і відповідати точно.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Докладніше: [Встановлення](/uk/install) і [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Як установити OpenClaw на Linux?">
    Коротка відповідь: дотримуйтеся посібника для Linux, потім запустіть онбординг.

    - Швидкий шлях для Linux + встановлення служби: [Linux](/uk/platforms/linux).
    - Повний покроковий посібник: [Початок роботи](/uk/start/getting-started).
    - Інсталятор + оновлення: [Встановлення й оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Як установити OpenClaw на VPS?">
    Підійде будь-який Linux VPS. Установіть на сервері, потім використовуйте SSH/Tailscale для доступу до Gateway.

    Посібники: [exe.dev](/uk/install/exe-dev), [Hetzner](/uk/install/hetzner), [Fly.io](/uk/install/fly).
    Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де знаходяться посібники зі встановлення в хмарі/VPS?">
    Ми підтримуємо **хаб хостингу** з поширеними провайдерами. Виберіть одного й дотримуйтесь посібника:

    - [VPS-хостинг](/uk/vps) (усі провайдери в одному місці)
    - [Fly.io](/uk/install/fly)
    - [Hetzner](/uk/install/hetzner)
    - [exe.dev](/uk/install/exe-dev)

    Як це працює в хмарі: **Gateway працює на сервері**, а ви отримуєте до нього доступ
    зі свого ноутбука/телефона через Control UI (або Tailscale/SSH). Ваш стан і робочий простір
    живуть на сервері, тому вважайте хост джерелом істини й робіть його резервні копії.

    Ви можете підключати **nodes** (Mac/iOS/Android/headless) до цього хмарного Gateway, щоб отримувати доступ до
    локального екрана/камери/canvas або запускати команди на ноутбуці, зберігаючи
    Gateway у хмарі.

    Хаб: [Платформи](/uk/platforms). Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).
    Nodes: [Nodes](/uk/nodes), [CLI Nodes](/uk/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я попросити OpenClaw оновити себе?">
    Коротка відповідь: **можливо, але не рекомендовано**. Процес оновлення може перезапустити
    Gateway (що розірве активну сесію), може потребувати чистого git checkout і
    може запитати підтвердження. Безпечніше: запускати оновлення з оболонки як оператор.

    Використовуйте CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Якщо все ж потрібно автоматизувати з агента:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Документація: [Оновлення](/uk/cli/update), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Що насправді робить онбординг?">
    `openclaw onboard` — це рекомендований шлях налаштування. У **локальному режимі** він проводить вас через:

    - **Налаштування моделі/автентифікації** (OAuth провайдера, API-ключі, Anthropic setup-token, а також локальні варіанти моделей, як-от LM Studio)
    - Розташування **робочого простору** + bootstrap-файли
    - **Параметри Gateway** (bind/port/auth/tailscale)
    - **Канали** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, а також вбудовані channel Plugins, як-от QQ Bot)
    - **Встановлення демона** (LaunchAgent на macOS; systemd user unit на Linux/WSL2)
    - **Перевірки справності** і вибір **Skills**

    Він також попереджає, якщо налаштована вами модель невідома або для неї відсутня автентифікація.

  </Accordion>

  <Accordion title="Чи потрібна мені підписка Claude або OpenAI, щоб це працювало?">
    Ні. Ви можете запускати OpenClaw з **API-ключами** (Anthropic/OpenAI/інші) або з
    **лише локальними моделями**, щоб ваші дані залишалися на вашому пристрої. Підписки (Claude
    Pro/Max або OpenAI Codex) — це необов'язкові способи автентифікації в цих провайдерів.

    Для Anthropic в OpenClaw практичний поділ такий:

    - **API-ключ Anthropic**: звичайна оплата Anthropic API
    - **Автентифікація Claude CLI / підпискою Claude в OpenClaw**: співробітники Anthropic
      повідомили нам, що таке використання знову дозволено, і OpenClaw розглядає використання `claude -p`
      як санкціоноване для цієї інтеграції, якщо Anthropic не опублікує нову
      політику

    Для довготривалих хостів gateway API-ключі Anthropic все ще є більш
    передбачуваним налаштуванням. OpenAI Codex OAuth явно підтримується для зовнішніх
    інструментів, таких як OpenClaw.

    OpenClaw також підтримує інші хостовані варіанти в стилі підписок, зокрема
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** і
    **Z.AI / GLM Coding Plan**.

    Документація: [Anthropic](/uk/providers/anthropic), [OpenAI](/uk/providers/openai),
    [Qwen Cloud](/uk/providers/qwen),
    [MiniMax](/uk/providers/minimax), [GLM Models](/uk/providers/glm),
    [Локальні моделі](/uk/gateway/local-models), [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Чи можу я використовувати підписку Claude Max без API-ключа?">
    Так.

    Співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволено, тому
    OpenClaw розглядає автентифікацію підпискою Claude та використання `claude -p` як санкціоновані
    для цієї інтеграції, якщо Anthropic не опублікує нову політику. Якщо ви хочете
    найпередбачуваніше налаштування на стороні сервера, замість цього використовуйте API-ключ Anthropic.

  </Accordion>

  <Accordion title="Чи підтримуєте ви автентифікацію підпискою Claude (Claude Pro або Max)?">
    Так.

    Співробітники Anthropic повідомили нам, що таке використання знову дозволено, тому OpenClaw розглядає
    повторне використання Claude CLI та використання `claude -p` як санкціоновані для цієї інтеграції,
    якщо Anthropic не опублікує нову політику.

    Anthropic setup-token усе ще доступний як підтримуваний шлях токена OpenClaw, але тепер OpenClaw віддає перевагу повторному використанню Claude CLI та `claude -p`, коли це можливо.
    Для production або багатокористувацьких навантажень автентифікація API-ключем Anthropic усе ще є
    безпечнішим і передбачуванішим вибором. Якщо вам потрібні інші хостовані
    варіанти в стилі підписок в OpenClaw, дивіться [OpenAI](/uk/providers/openai), [Qwen / Model
    Cloud](/uk/providers/qwen), [MiniMax](/uk/providers/minimax) і [GLM
    Models](/uk/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Чому я бачу HTTP 429 rate_limit_error від Anthropic?">
    Це означає, що ваша **квота/ліміт швидкості Anthropic** вичерпано для поточного вікна. Якщо ви
    використовуєте **Claude CLI**, зачекайте, поки вікно скинеться, або оновіть свій план. Якщо ви
    використовуєте **API-ключ Anthropic**, перевірте Anthropic Console
    щодо використання/оплати та за потреби підвищте ліміти.

    Якщо повідомлення конкретно таке:
    `Extra usage is required for long context requests`, запит намагається використати
    бета-функцію 1M context від Anthropic (`context1m: true`). Це працює лише тоді, коли ваші
    облікові дані підходять для оплати long-context (оплата за API-ключем або
    шлях входу Claude в OpenClaw з увімкненим Extra Usage).

    Порада: налаштуйте **fallback model**, щоб OpenClaw міг продовжувати відповідати, поки провайдер упирається в rate limit.
    Дивіться [Models](/uk/cli/models), [OAuth](/uk/concepts/oauth) і
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/uk/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Чи підтримується AWS Bedrock?">
    Так. OpenClaw має вбудованого провайдера **Amazon Bedrock (Converse)**. Якщо присутні AWS env markers, OpenClaw може автоматично виявити каталог streaming/text Bedrock і об'єднати його як неявного провайдера `amazon-bedrock`; інакше ви можете явно ввімкнути `plugins.entries.amazon-bedrock.config.discovery.enabled` або додати запис провайдера вручну. Дивіться [Amazon Bedrock](/uk/providers/bedrock) і [Провайдери моделей](/uk/providers/models). Якщо ви віддаєте перевагу керованому потоку ключів, OpenAI-сумісний proxy перед Bedrock теж лишається коректним варіантом.
  </Accordion>

  <Accordion title="Як працює автентифікація Codex?">
    OpenClaw підтримує **OpenAI Code (Codex)** через OAuth (вхід через ChatGPT). Використовуйте
    `openai-codex/gpt-5.5` для Codex OAuth через стандартний PI runner. Використовуйте
    `openai/gpt-5.5` для прямого доступу через API-ключ OpenAI. GPT-5.5 також може використовувати
    підписку/OAuth через `openai-codex/gpt-5.5` або нативні запускі Codex app-server
    з `openai/gpt-5.5` і `agentRuntime.id: "codex"`.
    Дивіться [Провайдери моделей](/uk/concepts/model-providers) і [Онбординг (CLI)](/uk/start/wizard).
  </Accordion>

  <Accordion title="Чому OpenClaw досі згадує openai-codex?">
    `openai-codex` — це ідентифікатор провайдера та auth profile для ChatGPT/Codex OAuth.
    Це також явний префікс моделі PI для Codex OAuth:

    - `openai/gpt-5.5` = поточний прямий маршрут API-ключа OpenAI у PI
    - `openai-codex/gpt-5.5` = маршрут Codex OAuth у PI
    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = нативний маршрут Codex app-server
    - `openai-codex:...` = ідентифікатор auth profile, а не посилання на модель

    Якщо вам потрібен прямий шлях оплати/лімітів OpenAI Platform, налаштуйте
    `OPENAI_API_KEY`. Якщо вам потрібна автентифікація підпискою ChatGPT/Codex, увійдіть через
    `openclaw models auth login --provider openai-codex` і використовуйте
    посилання на моделі `openai-codex/*` для запусків PI.

  </Accordion>

  <Accordion title="Чому ліміти Codex OAuth можуть відрізнятися від ChatGPT web?">
    Codex OAuth використовує керовані OpenAI, залежні від плану вікна квот. На практиці
    ці ліміти можуть відрізнятися від досвіду на сайті/в застосунку ChatGPT, навіть коли
    обидва прив'язані до одного облікового запису.

    OpenClaw може показати поточні видимі вікна використання/квот провайдера в
    `openclaw models status`, але він не вигадує і не нормалізує права ChatGPT-web
    у прямий API-доступ. Якщо вам потрібен прямий шлях оплати/лімітів OpenAI Platform,
    використовуйте `openai/*` з API-ключем.

  </Accordion>

  <Accordion title="Чи підтримуєте ви автентифікацію підпискою OpenAI (Codex OAuth)?">
    Так. OpenClaw повністю підтримує **OAuth-підписку OpenAI Code (Codex)**.
    OpenAI явно дозволяє використання OAuth-підписки в зовнішніх інструментах/робочих процесах
    на кшталт OpenClaw. Онбординг може виконати OAuth-потік за вас.

    Дивіться [OAuth](/uk/concepts/oauth), [Провайдери моделей](/uk/concepts/model-providers) і [Онбординг (CLI)](/uk/start/wizard).

  </Accordion>

  <Accordion title="Як налаштувати Gemini CLI OAuth?">
    Gemini CLI використовує **потік автентифікації Plugin**, а не client id чи secret у `openclaw.json`.

    Кроки:

    1. Установіть Gemini CLI локально, щоб `gemini` був у `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Увімкніть Plugin: `openclaw plugins enable google`
    3. Увійдіть: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Типова модель після входу: `google-gemini-cli/gemini-3-flash-preview`
    5. Якщо запити не працюють, задайте `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості gateway

    Це зберігає OAuth-токени в auth profiles на хості gateway. Подробиці: [Провайдери моделей](/uk/concepts/model-providers).

  </Accordion>

  <Accordion title="Чи підходить локальна модель для невимушених чатів?">
    Зазвичай ні. OpenClaw потребує великого контексту + сильної безпеки; малі карти усе обрізають і пропускають витоки. Якщо мусите, запускайте **найбільшу** збірку моделі, яку можете локально (LM Studio), і дивіться [/gateway/local-models](/uk/gateway/local-models). Менші/квантизовані моделі підвищують ризик prompt injection — дивіться [Безпека](/uk/gateway/security).
  </Accordion>

  <Accordion title="Як утримувати трафік хостованих моделей у певному регіоні?">
    Вибирайте endpoints із прив'язкою до регіону. OpenRouter надає варіанти з розміщенням у США для MiniMax, Kimi і GLM; вибирайте варіант із хостингом у США, щоб утримувати дані в регіоні. Ви все одно можете вказувати Anthropic/OpenAI поруч із ними, використовуючи `models.mode: "merge"`, щоб fallback залишалися доступними з урахуванням вибраного вами регіонального провайдера.
  </Accordion>

  <Accordion title="Чи треба купувати Mac Mini, щоб це встановити?">
    Ні. OpenClaw працює на macOS або Linux (Windows через WSL2). Mac mini — необов'язковий варіант: дехто
    купує його як постійно ввімкнений хост, але також підійде невеликий VPS, домашній сервер або машина класу Raspberry Pi.

    Mac потрібен лише **для інструментів тільки для macOS**. Для iMessage використовуйте [BlueBubbles](/uk/channels/bluebubbles) (рекомендовано) — сервер BlueBubbles працює на будь-якому Mac, а Gateway може працювати на Linux або деінде. Якщо вам потрібні інші інструменти лише для macOS, запускайте Gateway на Mac або підключіть macOS Node.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes), [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи потрібен Mac mini для підтримки iMessage?">
    Вам потрібен **якийсь пристрій macOS**, увійшовший у Messages. Це **не обов'язково** має бути Mac mini —
    підійде будь-який Mac. Для iMessage **використовуйте [BlueBubbles](/uk/channels/bluebubbles)** (рекомендовано) — сервер BlueBubbles працює на macOS, тоді як Gateway може працювати на Linux або деінде.

    Поширені конфігурації:

    - Запускайте Gateway на Linux/VPS, а сервер BlueBubbles — на будь-якому Mac, увійшовшому в Messages.
    - Запускайте все на Mac, якщо вам потрібна найпростіша конфігурація на одній машині.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes),
    [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Якщо я куплю Mac mini для запуску OpenClaw, чи можу я підключити його до свого MacBook Pro?">
    Так. **Mac mini може запускати Gateway**, а ваш MacBook Pro може підключатися як
    **Node** (додатковий пристрій). Nodes не запускають Gateway — вони надають додаткові
    можливості, як-от екран/камера/canvas і `system.run` на цьому пристрої.

    Типовий сценарій:

    - Gateway на Mac mini (постійно ввімкнений).
    - MacBook Pro запускає застосунок macOS або хост Node і спарюється з Gateway.
    - Використовуйте `openclaw nodes status` / `openclaw nodes list`, щоб побачити його.

    Документація: [Nodes](/uk/nodes), [CLI Nodes](/uk/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я використовувати Bun?">
    Bun **не рекомендовано**. Ми спостерігаємо помилки середовища виконання, особливо з WhatsApp і Telegram.
    Використовуйте **Node** для стабільних Gateway.

    Якщо ви все ж хочете поекспериментувати з Bun, робіть це на непродакшн Gateway
    без WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: що вказувати в allowFrom?">
    `channels.telegram.allowFrom` — це **Telegram user ID відправника-людини** (числовий). Це не ім'я користувача бота.

    Під час налаштування запитуються лише числові user ID. Якщо у вас уже є застарілі записи `@username` у конфігурації, `openclaw doctor --fix` може спробувати їх розв'язати.

    Безпечніший спосіб (без стороннього бота):

    - Напишіть у DM своєму боту, потім запустіть `openclaw logs --follow` і прочитайте `from.id`.

    Офіційний Bot API:

    - Напишіть у DM своєму боту, потім викличте `https://api.telegram.org/bot<bot_token>/getUpdates` і прочитайте `message.from.id`.

    Сторонній сервіс (менш приватно):

    - Напишіть у DM `@userinfobot` або `@getidsbot`.

    Дивіться [/channels/telegram](/uk/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Чи можуть кілька людей використовувати один номер WhatsApp з різними екземплярами OpenClaw?">
    Так, через **маршрутизацію з кількома агентами**. Прив'яжіть DM WhatsApp кожного відправника **DM** (peer `kind: "direct"`, E.164 відправника на кшталт `+15551234567`) до іншого `agentId`, щоб кожна людина мала власний робочий простір і сховище сесій. Відповіді все одно надходитимуть із **того самого облікового запису WhatsApp**, а керування доступом DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) є глобальним для кожного облікового запису WhatsApp. Дивіться [Маршрутизація з кількома агентами](/uk/concepts/multi-agent) і [WhatsApp](/uk/channels/whatsapp).
  </Accordion>

  <Accordion title='Чи можу я запустити агента "швидкий чат" і агента "Opus для кодування"?'>
    Так. Використовуйте маршрутизацію з кількома агентами: призначте кожному агенту свою типову модель, а потім прив'яжіть вхідні маршрути (обліковий запис провайдера або конкретні peers) до кожного агента. Приклад конфігурації наведено в [Маршрутизація з кількома агентами](/uk/concepts/multi-agent). Дивіться також [Моделі](/uk/concepts/models) і [Конфігурація](/uk/gateway/configuration).
  </Accordion>

  <Accordion title="Чи працює Homebrew на Linux?">
    Так. Homebrew підтримує Linux (Linuxbrew). Швидке налаштування:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Якщо ви запускаєте OpenClaw через systemd, переконайтеся, що PATH служби містить `/home/linuxbrew/.linuxbrew/bin` (або ваш префікс brew), щоб інструменти, встановлені через `brew`, розпізнавалися в non-login оболонках.
    Останні збірки також додають на початок common user bin dirs у Linux-службах systemd (наприклад, `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) і враховують `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` і `FNM_DIR`, якщо вони задані.

  </Accordion>

  <Accordion title="Різниця між hackable git install і npm install">
    - **Hackable (git) install:** повний checkout вихідного коду, можна редагувати, найкраще для контриб'юторів.
      Ви локально запускаєте збірки та можете виправляти код/документацію.
    - **npm install:** глобальне встановлення CLI, без репозиторію, найкраще для сценарію "просто запустити".
      Оновлення надходять із npm dist-tags.

    Документація: [Початок роботи](/uk/start/getting-started), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Чи можу я пізніше перемикатися між npm і git встановленнями?">
    Так. Використовуйте `openclaw update --channel ...`, коли OpenClaw уже встановлено.
    Це **не видаляє ваші дані** — це лише змінює спосіб встановлення коду OpenClaw.
    Ваш стан (`~/.openclaw`) і робочий простір (`~/.openclaw/workspace`) залишаються недоторканими.

    З npm на git:

    ```bash
    openclaw update --channel dev
    ```

    З git на npm:

    ```bash
    openclaw update --channel stable
    ```

    Додайте `--dry-run`, щоб спочатку переглянути заплановане перемикання режиму. Засіб оновлення запускає
    подальші дії Doctor, оновлює джерела Plugin для цільового каналу й
    перезапускає gateway, якщо ви не передасте `--no-restart`.

    Інсталятор також може примусово вибрати будь-який режим:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Поради щодо резервного копіювання: дивіться [Стратегія резервного копіювання](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Чи варто запускати Gateway на ноутбуці чи на VPS?">
    Коротка відповідь: **якщо вам потрібна надійність 24/7, використовуйте VPS**. Якщо вам потрібне
    найменше тертя й вас влаштовують сон/перезапуски, запускайте локально.

    **Ноутбук (локальний Gateway)**

    - **Плюси:** немає вартості сервера, прямий доступ до локальних файлів, видиме вікно браузера.
    - **Мінуси:** сон/мережеві обриви = відключення, оновлення ОС/перезавантаження переривають роботу, комп'ютер має залишатися активним.

    **VPS / хмара**

    - **Плюси:** постійно ввімкнений, стабільна мережа, немає проблем зі сном ноутбука, легше підтримувати в роботі.
    - **Мінуси:** часто headless-режим (використовуйте скриншоти), лише віддалений доступ до файлів, для оновлень потрібен SSH.

    **Примітка щодо OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord чудово працюють із VPS. Єдиний справжній компроміс — **headless browser** проти видимого вікна. Дивіться [Браузер](/uk/tools/browser).

    **Рекомендований варіант за замовчуванням:** VPS, якщо у вас раніше були відключення gateway. Локальний запуск чудово підходить, коли ви активно користуєтеся Mac і хочете локальний доступ до файлів або автоматизацію UI з видимим браузером.

  </Accordion>

  <Accordion title="Наскільки важливо запускати OpenClaw на окремій машині?">
    Не обов'язково, але **рекомендовано для надійності та ізоляції**.

    - **Виділений хост (VPS/Mac mini/Pi):** постійно ввімкнений, менше переривань через сон/перезавантаження, чистіші дозволи, легше підтримувати безперервну роботу.
    - **Спільний ноутбук/настільний комп'ютер:** цілком нормально для тестування та активного використання, але очікуйте пауз, коли машина переходить у сон або оновлюється.

    Якщо ви хочете отримати найкраще з обох світів, тримайте Gateway на виділеному хості й підключіть ноутбук як **Node** для локальних інструментів screen/camera/exec. Дивіться [Nodes](/uk/nodes).
    Для рекомендацій щодо безпеки прочитайте [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які мінімальні вимоги до VPS і яка ОС рекомендована?">
    OpenClaw легковаговий. Для базового Gateway + одного чат-каналу:

    - **Абсолютний мінімум:** 1 vCPU, 1GB RAM, ~500MB диска.
    - **Рекомендовано:** 1-2 vCPU, 2GB RAM або більше із запасом (журнали, медіа, кілька каналів). Інструменти Node і автоматизація браузера можуть бути вимогливими до ресурсів.

    ОС: використовуйте **Ubuntu LTS** (або будь-який сучасний Debian/Ubuntu). Шлях встановлення для Linux найкраще протестовано саме там.

    Документація: [Linux](/uk/platforms/linux), [VPS-хостинг](/uk/vps).

  </Accordion>

  <Accordion title="Чи можу я запускати OpenClaw у VM і які вимоги?">
    Так. Ставтеся до VM так само, як до VPS: вона має бути постійно ввімкненою, доступною й мати достатньо
    RAM для Gateway та будь-яких каналів, які ви ввімкнете.

    Базові рекомендації:

    - **Абсолютний мінімум:** 1 vCPU, 1GB RAM.
    - **Рекомендовано:** 2GB RAM або більше, якщо ви запускаєте кілька каналів, автоматизацію браузера або медіаінструменти.
    - **ОС:** Ubuntu LTS або інший сучасний Debian/Ubuntu.

    Якщо ви використовуєте Windows, **WSL2 — це найпростіший варіант налаштування у стилі VM** і він має найкращу
    сумісність з інструментами. Дивіться [Windows](/uk/platforms/windows), [VPS-хостинг](/uk/vps).
    Якщо ви запускаєте macOS у VM, дивіться [macOS VM](/uk/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Пов'язане

- [ЧаПи](/uk/help/faq) — основні ЧаПи (моделі, сесії, gateway, безпека тощо)
- [Огляд встановлення](/uk/install)
- [Початок роботи](/uk/start/getting-started)
- [Усунення несправностей](/uk/help/troubleshooting)
