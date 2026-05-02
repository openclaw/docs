---
read_when:
    - Нове встановлення, зависання онбордингу або помилки першого запуску
    - Вибір автентифікації та підписок провайдера
    - Немає доступу до docs.openclaw.ai, не вдається відкрити панель керування, встановлення зависло
sidebarTitle: First-run FAQ
summary: 'Поширені запитання: швидкий старт і налаштування першого запуску — встановлення, онбординг, автентифікація, підписки, початкові збої'
title: 'Поширені запитання: налаштування під час першого запуску'
x-i18n:
    generated_at: "2026-05-02T02:37:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 469fbd24fea69d91c5b0408dff9c7d7b2382f9c59430a1d5331cb5dcabdce295
    source_path: help/faq-first-run.md
    workflow: 16
---

  Швидкий старт і Q&A для першого запуску. Для щоденних операцій, моделей, автентифікації, сесій
  і усунення несправностей див. основний [FAQ](/uk/help/faq).

  ## Швидкий старт і налаштування першого запуску

  <AccordionGroup>
  <Accordion title="Я застряг, найшвидший спосіб розблокуватися">
    Використайте локального AI-агента, який може **бачити вашу машину**. Це значно ефективніше, ніж питати
    в Discord, бо більшість випадків "я застряг" є **локальними проблемами конфігурації або середовища**,
    які віддалені помічники не можуть перевірити.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Ці інструменти можуть читати репозиторій, запускати команди, переглядати журнали й допомагати виправляти
    налаштування на рівні машини (PATH, служби, дозволи, файли автентифікації). Надайте їм **повний checkout вихідного коду** через
    встановлення hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це встановлює OpenClaw **з git checkout**, тож агент може читати код + документацію і
    міркувати про точну версію, яку ви запускаєте. Пізніше завжди можна повернутися до stable,
    повторно запустивши інсталятор без `--install-method git`.

    Порада: попросіть агента **спланувати й супроводжувати** виправлення (крок за кроком), а потім виконати лише
    необхідні команди. Так зміни лишаються невеликими й простішими для аудиту.

    Якщо ви виявили справжню помилку або виправлення, будь ласка, створіть GitHub issue або надішліть PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Почніть із цих команд (діліться виводом, коли просите про допомогу):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Що вони роблять:

    - `openclaw status`: короткий знімок стану gateway/агента + базова конфігурація.
    - `openclaw models status`: перевіряє автентифікацію провайдера + доступність моделей.
    - `openclaw doctor`: перевіряє і виправляє типові проблеми конфігурації/стану.

    Інші корисні перевірки CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Швидкий цикл налагодження: [Перші 60 секунд, якщо щось зламано](#first-60-seconds-if-something-is-broken).
    Документація зі встановлення: [Встановлення](/uk/install), [Прапорці інсталятора](/uk/install/installer), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Heartbeat постійно пропускається. Що означають причини пропуску?">
    Типові причини пропуску Heartbeat:

    - `quiet-hours`: поза налаштованим вікном активних годин
    - `empty-heartbeat-file`: `HEARTBEAT.md` існує, але містить лише порожній/тільки заголовковий каркас
    - `no-tasks-due`: режим завдань `HEARTBEAT.md` активний, але інтервали жодного завдання ще не настали
    - `alerts-disabled`: усю видимість Heartbeat вимкнено (`showOk`, `showAlerts` і `useIndicator` усі вимкнені)

    У режимі завдань часові позначки настання просуваються лише після завершення
    справжнього запуску Heartbeat. Пропущені запуски не позначають завдання як виконані.

    Документація: [Heartbeat](/uk/gateway/heartbeat), [Автоматизація та завдання](/uk/automation).

  </Accordion>

  <Accordion title="Рекомендований спосіб встановити й налаштувати OpenClaw">
    Репозиторій рекомендує запуск із вихідного коду та використання onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Майстер також може автоматично зібрати ресурси UI. Після onboarding ви зазвичай запускаєте Gateway на порту **18789**.

    З вихідного коду (контриб'ютори/розробка):

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

  <Accordion title="Як автентифікувати панель керування на localhost і віддалено?">
    **Localhost (та сама машина):**

    - Відкрийте `http://127.0.0.1:18789/`.
    - Якщо запитується автентифікація через shared-secret, вставте налаштований токен або пароль у налаштування Control UI.
    - Джерело токена: `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`).
    - Джерело пароля: `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо shared secret ще не налаштовано, згенеруйте токен за допомогою `openclaw doctor --generate-gateway-token`.

    **Не на localhost:**

    - **Tailscale Serve** (рекомендовано): лишайте прив'язку до loopback, запустіть `openclaw gateway --tailscale serve`, відкрийте `https://<magicdns>/`. Якщо `gateway.auth.allowTailscale` має значення `true`, заголовки ідентичності задовольняють автентифікацію Control UI/WebSocket (без вставленого shared secret, передбачається довірений хост Gateway); HTTP API все одно потребують автентифікації через shared-secret, якщо ви свідомо не використовуєте private-ingress `none` або HTTP-автентифікацію trusted-proxy.
      Невдалі паралельні спроби автентифікації Serve від одного клієнта серіалізуються до того, як лімітатор failed-auth їх записує, тому друга невдала повторна спроба вже може показати `retry later`.
    - **Прив'язка Tailnet**: запустіть `openclaw gateway --bind tailnet --token "<token>"` (або налаштуйте автентифікацію паролем), відкрийте `http://<tailscale-ip>:18789/`, а потім вставте відповідний shared secret у налаштуваннях панелі керування.
    - **Identity-aware reverse proxy**: тримайте Gateway за довіреним проксі, налаштуйте `gateway.auth.mode: "trusted-proxy"`, потім відкрийте URL проксі. Проксі same-host loopback потребують явного `gateway.auth.trustedProxy.allowLoopback = true`.
    - **SSH-тунель**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, потім відкрийте `http://127.0.0.1:18789/`. Автентифікація через shared-secret усе одно застосовується через тунель; вставте налаштований токен або пароль, якщо буде запит.

    Див. [Панель керування](/uk/web/dashboard) і [Вебповерхні](/uk/web) щодо режимів прив'язки й деталей автентифікації.

  </Accordion>

  <Accordion title="Чому є дві конфігурації підтвердження exec для підтверджень у чаті?">
    Вони керують різними шарами:

    - `approvals.exec`: пересилає запити підтвердження до чат-призначень
    - `channels.<channel>.execApprovals`: змушує цей канал діяти як нативний клієнт підтвердження для exec-підтверджень

    Політика host exec усе одно є справжнім шлюзом підтвердження. Конфігурація чату лише керує тим, де
    з'являються запити підтвердження і як люди можуть на них відповідати.

    У більшості налаштувань вам **не** потрібні обидва:

    - Якщо чат уже підтримує команди й відповіді, same-chat `/approve` працює через спільний шлях.
    - Якщо підтримуваний нативний канал може безпечно визначати approvers, OpenClaw тепер автоматично вмикає DM-first нативні підтвердження, коли `channels.<channel>.execApprovals.enabled` не задано або має значення `"auto"`.
    - Коли доступні нативні картки/кнопки підтвердження, цей нативний UI є основним шляхом; агент має включати ручну команду `/approve` лише якщо результат інструмента каже, що чат-підтвердження недоступні або ручне підтвердження є єдиним шляхом.
    - Використовуйте `approvals.exec` лише коли запити також потрібно пересилати в інші чати або явні ops-кімнати.
    - Використовуйте `channels.<channel>.execApprovals.target: "channel"` або `"both"` лише коли ви явно хочете, щоб запити підтвердження публікувалися назад у початкову кімнату/тему.
    - Plugin-підтвердження знову окремі: вони використовують same-chat `/approve` за замовчуванням, необов'язкове пересилання `approvals.plugin`, і лише деякі нативні канали зберігають plugin-approval-native обробку поверх цього.

    Коротко: пересилання потрібне для маршрутизації, конфігурація нативного клієнта — для багатшого UX, специфічного для каналу.
    Див. [Exec Approvals](/uk/tools/exec-approvals).

  </Accordion>

  <Accordion title="Яке середовище виконання потрібне?">
    Потрібен Node **>= 22**. Рекомендовано `pnpm`. Bun **не рекомендований** для Gateway.
  </Accordion>

  <Accordion title="Чи працює це на Raspberry Pi?">
    Так. Gateway легковаговий - документація вказує **512MB-1GB RAM**, **1 ядро** і приблизно **500MB**
    диска як достатні для особистого використання, а також зазначає, що **Raspberry Pi 4 може його запускати**.

    Якщо потрібен додатковий запас (журнали, медіа, інші служби), **рекомендовано 2GB**, але це
    не жорсткий мінімум.

    Порада: невеликий Pi/VPS може розміщувати Gateway, а ви можете під'єднати **вузли** на ноутбуці/телефоні для
    локального екрана/камери/canvas або виконання команд. Див. [Вузли](/uk/nodes).

  </Accordion>

  <Accordion title="Є поради для встановлення на Raspberry Pi?">
    Коротко: це працює, але очікуйте шорсткі місця.

    - Використовуйте **64-bit** OS і тримайте Node >= 22.
    - Віддавайте перевагу **hackable (git) install**, щоб бачити журнали й швидко оновлюватися.
    - Почніть без каналів/Skills, потім додавайте їх по одному.
    - Якщо натрапите на дивні проблеми з бінарними файлами, зазвичай це проблема **ARM-сумісності**.

    Документація: [Linux](/uk/platforms/linux), [Встановлення](/uk/install).

  </Accordion>

  <Accordion title="Застрягло на wake up my friend / onboarding не вилуплюється. Що тепер?">
    Цей екран залежить від того, чи Gateway доступний і автентифікований. TUI також автоматично надсилає
    "Wake up, my friend!" під час першого hatch. Якщо ви бачите цей рядок **без відповіді**
    і токени лишаються на 0, агент ніколи не запускався.

    1. Перезапустіть Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Перевірте статус + автентифікацію:

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
    збереже вашого бота "точно таким самим" (memory, історія сесій, автентифікація і стан каналів),
    якщо скопіювати **обидві** локації:

    1. Встановіть OpenClaw на новій машині.
    2. Скопіюйте `$OPENCLAW_STATE_DIR` (за замовчуванням: `~/.openclaw`) зі старої машини.
    3. Скопіюйте свій робочий простір (за замовчуванням: `~/.openclaw/workspace`).
    4. Запустіть `openclaw doctor` і перезапустіть службу Gateway.

    Це зберігає конфігурацію, профілі автентифікації, облікові дані WhatsApp, сесії та memory. Якщо ви в
    віддаленому режимі, пам'ятайте, що хост gateway володіє сховищем сесій і робочим простором.

    **Важливо:** якщо ви лише commit/push свій робочий простір у GitHub, ви створюєте резервну копію
    **memory + bootstrap-файлів**, але **не** історії сесій або автентифікації. Вони живуть
    у `~/.openclaw/` (наприклад `~/.openclaw/agents/<agentId>/sessions/`).

    Пов'язане: [Міграція](/uk/install/migrating), [Де речі живуть на диску](#where-things-live-on-disk),
    [Робочий простір агента](/uk/concepts/agent-workspace), [Doctor](/uk/gateway/doctor),
    [Віддалений режим](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де подивитися, що нового в останній версії?">
    Перевірте GitHub changelog:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Найновіші записи зверху. Якщо верхній розділ позначено **Unreleased**, наступний датований
    розділ є останньою випущеною версією. Записи згруповано за **Highlights**, **Changes** і
    **Fixes** (плюс розділи docs/other, коли потрібно).

  </Accordion>

  <Accordion title="Немає доступу до docs.openclaw.ai (SSL-помилка)">
    Деякі підключення Comcast/Xfinity некоректно блокують `docs.openclaw.ai` через Xfinity
    Advanced Security. Вимкніть це або додайте `docs.openclaw.ai` до allowlist, потім спробуйте знову.
    Будь ласка, допоможіть нам розблокувати це, повідомивши тут: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Якщо ви все ще не можете дістатися сайту, документація дзеркалиться на GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Різниця між стабільною та бета-версією">
    **Стабільна** і **бета** — це **npm dist-tags**, а не окремі гілки коду:

    - `latest` = стабільна
    - `beta` = рання збірка для тестування

    Зазвичай стабільний реліз спочатку потрапляє в **beta**, а потім явний
    крок просування переносить ту саму версію в `latest`. Супровідники також можуть
    публікувати напряму в `latest`, коли це потрібно. Саме тому бета й стабільна версія можуть
    вказувати на **ту саму версію** після просування.

    Подивіться, що змінилося:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Однорядкові команди встановлення та різницю між бета й dev дивіться в акордеоні нижче.

  </Accordion>

  <Accordion title="Як установити бета-версію і яка різниця між beta та dev?">
    **Бета** — це npm dist-tag `beta` (може збігатися з `latest` після просування).
    **Dev** — це рухома вершина `main` (git); під час публікації вона використовує npm dist-tag `dev`.

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

    Це дає локальний репозиторій, який можна редагувати, а потім оновлювати через git.

    Якщо віддаєте перевагу чистому ручному клонуванню, використайте:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Документація: [Оновлення](/uk/cli/update), [Канали розробки](/uk/install/development-channels),
    [Встановлення](/uk/install).

  </Accordion>

  <Accordion title="Скільки зазвичай тривають встановлення й онбординг?">
    Орієнтовно:

    - **Встановлення:** 2-5 хвилин
    - **Онбординг:** 5-15 хвилин залежно від кількості каналів/моделей, які ви налаштовуєте

    Якщо процес зависає, скористайтеся [Інсталятор застряг](#quick-start-and-first-run-setup)
    і швидким циклом налагодження в [Я застряг](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Інсталятор застряг? Як отримати більше зворотного зв’язку?">
    Повторно запустіть інсталятор із **докладним виводом**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Встановлення бета з докладним виводом:

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

    Більше варіантів: [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Під час встановлення у Windows написано, що git не знайдено або openclaw не розпізнано">
    Дві поширені проблеми Windows:

    **1) Помилка npm spawn git / git не знайдено**

    - Установіть **Git for Windows** і переконайтеся, що `git` є у вашому PATH.
    - Закрийте й знову відкрийте PowerShell, а потім повторно запустіть інсталятор.

    **2) openclaw не розпізнається після встановлення**

    - Ваша глобальна папка bin для npm не додана до PATH.
    - Перевірте шлях:

      ```powershell
      npm config get prefix
      ```

    - Додайте цей каталог до PATH користувача (у Windows суфікс `\bin` не потрібен; у більшості систем це `%AppData%\npm`).
    - Після оновлення PATH закрийте й знову відкрийте PowerShell.

    Якщо хочете найзручніше налаштування Windows, використовуйте **WSL2** замість нативного Windows.
    Документація: [Windows](/uk/platforms/windows).

  </Accordion>

  <Accordion title="Вивід exec у Windows показує спотворений китайський текст — що робити?">
    Зазвичай це невідповідність кодової сторінки консолі в нативних оболонках Windows.

    Симптоми:

    - Вивід `system.run`/`exec` показує китайський текст як mojibake
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

    Якщо це все ще відтворюється в найновішому OpenClaw, відстежуйте/повідомте про це тут:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Документація не відповіла на моє запитання — як отримати кращу відповідь?">
    Використайте **встановлення з можливістю змін (git)**, щоб мати повний вихідний код і документацію локально, а потім запитайте
    свого бота (або Claude/Codex) _з цієї папки_, щоб він міг прочитати репозиторій і відповісти точно.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Докладніше: [Встановлення](/uk/install) і [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Як установити OpenClaw на Linux?">
    Коротка відповідь: дотримуйтесь посібника для Linux, а потім запустіть онбординг.

    - Швидкий шлях для Linux + встановлення сервісу: [Linux](/uk/platforms/linux).
    - Повний покроковий посібник: [Початок роботи](/uk/start/getting-started).
    - Інсталятор + оновлення: [Встановлення й оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Як установити OpenClaw на VPS?">
    Підійде будь-який Linux VPS. Установіть на сервері, а потім використовуйте SSH/Tailscale для доступу до Gateway.

    Посібники: [exe.dev](/uk/install/exe-dev), [Hetzner](/uk/install/hetzner), [Fly.io](/uk/install/fly).
    Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де посібники з установлення в хмарі/VPS?">
    Ми підтримуємо **хаб хостингу** з поширеними провайдерами. Виберіть один і дотримуйтесь посібника:

    - [VPS-хостинг](/uk/vps) (усі провайдери в одному місці)
    - [Fly.io](/uk/install/fly)
    - [Hetzner](/uk/install/hetzner)
    - [exe.dev](/uk/install/exe-dev)

    Як це працює в хмарі: **Gateway працює на сервері**, а ви отримуєте до нього доступ
    із ноутбука/телефона через Control UI (або Tailscale/SSH). Ваш стан + робочий простір
    зберігаються на сервері, тож вважайте хост джерелом істини й створюйте його резервні копії.

    Ви можете прив’язати **вузли** (Mac/iOS/Android/headless) до цього хмарного Gateway, щоб отримувати доступ
    до локального екрана/камери/canvas або запускати команди на ноутбуці, залишаючи
    Gateway у хмарі.

    Хаб: [Платформи](/uk/platforms). Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).
    Вузли: [Вузли](/uk/nodes), [CLI вузлів](/uk/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я попросити OpenClaw оновити себе?">
    Коротка відповідь: **можливо, але не рекомендовано**. Процес оновлення може перезапустити
    Gateway (що перерве активний сеанс), може потребувати чистого git checkout і
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
    - Розташування **робочого простору** + початкові файли
    - **Налаштування Gateway** (bind/port/auth/tailscale)
    - **Канали** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, а також вбудовані Plugin каналів, як-от QQ Bot)
    - **Встановлення демона** (LaunchAgent на macOS; користувацький systemd unit на Linux/WSL2)
    - **Перевірки стану** і вибір **Skills**

    Він також попереджає, якщо налаштована модель невідома або їй бракує автентифікації.

  </Accordion>

  <Accordion title="Чи потрібна підписка Claude або OpenAI, щоб це запустити?">
    Ні. Ви можете запускати OpenClaw з **API-ключами** (Anthropic/OpenAI/інші) або з
    **суто локальними моделями**, щоб ваші дані залишалися на вашому пристрої. Підписки (Claude
    Pro/Max або OpenAI Codex) — необов’язкові способи автентифікації цих провайдерів.

    Для Anthropic в OpenClaw практичний поділ такий:

    - **API-ключ Anthropic**: звичайна оплата Anthropic API
    - **Claude CLI / автентифікація підписки Claude в OpenClaw**: співробітники Anthropic
      повідомили нам, що це використання знову дозволене, і OpenClaw вважає використання `claude -p`
      санкціонованим для цієї інтеграції, доки Anthropic не опублікує нову
      політику

    Для довготривалих хостів gateway API-ключі Anthropic усе ще є
    передбачуванішим налаштуванням. OAuth OpenAI Codex явно підтримується для зовнішніх
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
    для цієї інтеграції, доки Anthropic не опублікує нову політику. Якщо ви хочете
    найпередбачуваніше серверне налаштування, натомість використовуйте API-ключ Anthropic.

  </Accordion>

  <Accordion title="Чи підтримується автентифікація підписки Claude (Claude Pro або Max)?">
    Так.

    Співробітники Anthropic повідомили нам, що це використання знову дозволене, тому OpenClaw вважає
    повторне використання Claude CLI і використання `claude -p` санкціонованими для цієї інтеграції,
    доки Anthropic не опублікує нову політику.

    Anthropic setup-token усе ще доступний як підтримуваний шлях токена OpenClaw, але OpenClaw тепер віддає перевагу повторному використанню Claude CLI і `claude -p`, коли вони доступні.
    Для продакшн або багатокористувацьких навантажень автентифікація API-ключем Anthropic усе ще є
    безпечнішим і передбачуванішим вибором. Якщо вам потрібні інші розміщені
    варіанти в стилі підписки в OpenClaw, дивіться [OpenAI](/uk/providers/openai), [Qwen / Model
    Cloud](/uk/providers/qwen), [MiniMax](/uk/providers/minimax) і [GLM
    Models](/uk/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Чому я бачу HTTP 429 rate_limit_error від Anthropic?">
    Це означає, що ваша **квота/ліміт швидкості Anthropic** вичерпані для поточного вікна. Якщо ви
    використовуєте **Claude CLI**, зачекайте скидання вікна або оновіть свій план. Якщо ви
    використовуєте **API-ключ Anthropic**, перевірте Anthropic Console
    щодо використання/оплати й підвищте ліміти за потреби.

    Якщо повідомлення саме таке:
    `Extra usage is required for long context requests`, запит намагається використати
    бета-версію контексту 1M від Anthropic (`context1m: true`). Це працює лише тоді, коли ваші
    облікові дані придатні для оплати довгого контексту (оплата API-ключем або
    шлях входу Claude в OpenClaw з увімкненим Extra Usage).

    Порада: налаштуйте **резервну модель**, щоб OpenClaw міг продовжувати відповідати, коли провайдер має обмеження частоти.
    Див. [Моделі](/uk/cli/models), [OAuth](/uk/concepts/oauth) і
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/uk/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Чи підтримується AWS Bedrock?">
    Так. OpenClaw має вбудованого провайдера **Amazon Bedrock (Converse)**. За наявності маркерів середовища AWS OpenClaw може автоматично виявляти потоковий/текстовий каталог Bedrock і об’єднувати його як неявного провайдера `amazon-bedrock`; інакше ви можете явно ввімкнути `plugins.entries.amazon-bedrock.config.discovery.enabled` або додати запис провайдера вручну. Див. [Amazon Bedrock](/uk/providers/bedrock) і [Провайдери моделей](/uk/providers/models). Якщо вам зручніший керований потік ключів, OpenAI-сумісний проксі перед Bedrock також залишається коректним варіантом.
  </Accordion>

  <Accordion title="Як працює автентифікація Codex?">
    OpenClaw підтримує **OpenAI Code (Codex)** через OAuth (вхід ChatGPT). Використовуйте
    `openai/gpt-5.5` з `agentRuntime.id: "codex"` для типового налаштування:
    автентифікація підписки ChatGPT/Codex плюс нативне виконання на сервері застосунку Codex. Використовуйте
    `openai-codex/gpt-5.5` лише тоді, коли потрібен Codex OAuth через стандартний
    раннер PI. Використовуйте `openai/gpt-5.5` без перевизначення середовища виконання Codex для
    прямого доступу з API-ключем OpenAI.
    Див. [Провайдери моделей](/uk/concepts/model-providers) і [Початкове налаштування (CLI)](/uk/start/wizard).
  </Accordion>

  <Accordion title="Чому OpenClaw досі згадує openai-codex?">
    `openai-codex` — це ідентифікатор провайдера та профілю автентифікації для ChatGPT/Codex OAuth.
    Це також явний префікс моделі PI для Codex OAuth:

    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = автентифікація підписки ChatGPT/Codex з нативним середовищем виконання Codex
    - `openai-codex/gpt-5.5` = маршрут Codex OAuth у PI
    - `openai/gpt-5.5` без перевизначення середовища виконання Codex = прямий маршрут з API-ключем OpenAI у PI
    - `openai-codex:...` = ідентифікатор профілю автентифікації, а не посилання на модель

    Якщо вам потрібен прямий шлях білінгу/лімітів OpenAI Platform, задайте
    `OPENAI_API_KEY`. Якщо потрібна автентифікація підписки ChatGPT/Codex, увійдіть через
    `openclaw models auth login --provider openai-codex`. Для нативного середовища виконання Codex
    залиште посилання на модель як `openai/gpt-5.5` і задайте
    `agentRuntime.id: "codex"`. Використовуйте посилання на моделі `openai-codex/*` лише для запусків PI.

  </Accordion>

  <Accordion title="Чому ліміти Codex OAuth можуть відрізнятися від ChatGPT web?">
    Codex OAuth використовує керовані OpenAI квотні вікна, що залежать від плану. На практиці
    ці ліміти можуть відрізнятися від досвіду на сайті/в застосунку ChatGPT, навіть коли
    обидва прив’язані до того самого облікового запису.

    OpenClaw може показувати поточно видимі вікна використання/квот провайдера в
    `openclaw models status`, але він не вигадує й не нормалізує права ChatGPT-web
    у прямий доступ до API. Якщо вам потрібен прямий шлях білінгу/лімітів OpenAI Platform,
    використовуйте `openai/*` з API-ключем.

  </Accordion>

  <Accordion title="Чи підтримуєте ви автентифікацію підписки OpenAI (Codex OAuth)?">
    Так. OpenClaw повністю підтримує **OpenAI Code (Codex) subscription OAuth**.
    OpenAI явно дозволяє використання subscription OAuth у зовнішніх інструментах/робочих процесах,
    таких як OpenClaw. Початкове налаштування може виконати OAuth-потік за вас.

    Див. [OAuth](/uk/concepts/oauth), [Провайдери моделей](/uk/concepts/model-providers) і [Початкове налаштування (CLI)](/uk/start/wizard).

  </Accordion>

  <Accordion title="Як налаштувати Gemini CLI OAuth?">
    Gemini CLI використовує **потік автентифікації Plugin**, а не ідентифікатор клієнта чи секрет у `openclaw.json`.

    Кроки:

    1. Установіть Gemini CLI локально, щоб `gemini` був у `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Увімкніть Plugin: `openclaw plugins enable google`
    3. Увійдіть: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Стандартна модель після входу: `google-gemini-cli/gemini-3-flash-preview`
    5. Якщо запити не виконуються, задайте `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості gateway

    Це зберігає OAuth-токени в профілях автентифікації на хості gateway. Докладніше: [Провайдери моделей](/uk/concepts/model-providers).

  </Accordion>

  <Accordion title="Чи підходить локальна модель для звичайних чатів?">
    Зазвичай ні. OpenClaw потребує великого контексту + сильної безпеки; малі карти обрізають і пропускають дані. Якщо все ж потрібно, запускайте **найбільшу** збірку моделі, яку можете локально (LM Studio), і див. [/gateway/local-models](/uk/gateway/local-models). Менші/квантизовані моделі підвищують ризик prompt-injection — див. [Безпека](/uk/gateway/security).
  </Accordion>

  <Accordion title="Як утримувати трафік розміщених моделей у конкретному регіоні?">
    Вибирайте кінцеві точки, прив’язані до регіону. OpenRouter надає варіанти, розміщені у США, для MiniMax, Kimi та GLM; виберіть варіант, розміщений у США, щоб утримувати дані в регіоні. Ви все ще можете перелічувати Anthropic/OpenAI поруч із ними, використовуючи `models.mode: "merge"`, щоб резервні варіанти залишалися доступними з дотриманням вибраного регіонального провайдера.
  </Accordion>

  <Accordion title="Чи потрібно купувати Mac Mini, щоб установити це?">
    Ні. OpenClaw працює на macOS або Linux (Windows через WSL2). Mac mini необов’язковий — деякі люди
    купують його як постійно ввімкнений хост, але невеликий VPS, домашній сервер або пристрій класу Raspberry Pi також підійде.

    Mac потрібен лише **для інструментів, доступних тільки на macOS**. Для iMessage використовуйте [BlueBubbles](/uk/channels/bluebubbles) (рекомендовано) — сервер BlueBubbles працює на будь-якому Mac, а Gateway може працювати на Linux або деінде. Якщо вам потрібні інші інструменти лише для macOS, запускайте Gateway на Mac або спарюйте вузол macOS.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Вузли](/uk/nodes), [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи потрібен Mac mini для підтримки iMessage?">
    Вам потрібен **якийсь пристрій macOS**, на якому виконано вхід у Messages. Це **не** обов’язково має бути Mac mini —
    підійде будь-який Mac. **Використовуйте [BlueBubbles](/uk/channels/bluebubbles)** (рекомендовано) для iMessage — сервер BlueBubbles працює на macOS, тоді як Gateway може працювати на Linux або деінде.

    Типові налаштування:

    - Запустіть Gateway на Linux/VPS, а сервер BlueBubbles — на будь-якому Mac, де виконано вхід у Messages.
    - Запустіть усе на Mac, якщо хочете найпростіше налаштування на одному комп’ютері.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Вузли](/uk/nodes),
    [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Якщо я куплю Mac mini для запуску OpenClaw, чи можу підключити його до свого MacBook Pro?">
    Так. **Mac mini може запускати Gateway**, а ваш MacBook Pro може підключатися як
    **вузол** (супровідний пристрій). Вузли не запускають Gateway — вони надають додаткові
    можливості, як-от екран/камера/полотно та `system.run` на цьому пристрої.

    Типовий шаблон:

    - Gateway на Mac mini (постійно ввімкнений).
    - MacBook Pro запускає застосунок macOS або хост вузла й спарюється з Gateway.
    - Використовуйте `openclaw nodes status` / `openclaw nodes list`, щоб побачити його.

    Документація: [Вузли](/uk/nodes), [CLI вузлів](/uk/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я використовувати Bun?">
    Bun **не рекомендовано**. Ми бачимо помилки середовища виконання, особливо з WhatsApp і Telegram.
    Використовуйте **Node** для стабільних gateway.

    Якщо все ж хочете експериментувати з Bun, робіть це на не production gateway
    без WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: що вказувати в allowFrom?">
    `channels.telegram.allowFrom` — це **Telegram user ID людини-відправника** (числовий). Це не ім’я користувача бота.

    Налаштування запитує лише числові ідентифікатори користувачів. Якщо у вас уже є застарілі записи `@username` у конфігурації, `openclaw doctor --fix` може спробувати їх розпізнати.

    Безпечніше (без стороннього бота):

    - Напишіть своєму боту в DM, потім запустіть `openclaw logs --follow` і прочитайте `from.id`.

    Офіційний Bot API:

    - Напишіть своєму боту в DM, потім викличте `https://api.telegram.org/bot<bot_token>/getUpdates` і прочитайте `message.from.id`.

    Сторонній варіант (менш приватний):

    - Напишіть у DM `@userinfobot` або `@getidsbot`.

    Див. [/channels/telegram](/uk/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Чи можуть кілька людей використовувати один номер WhatsApp з різними екземплярами OpenClaw?">
    Так, через **маршрутизацію кількох агентів**. Прив’яжіть **DM** кожного відправника WhatsApp (peer `kind: "direct"`, відправник E.164 на кшталт `+15551234567`) до іншого `agentId`, щоб кожна людина мала власний робочий простір і сховище сесій. Відповіді все одно надходитимуть з **того самого облікового запису WhatsApp**, а контроль доступу DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) є глобальним для кожного облікового запису WhatsApp. Див. [Маршрутизація кількох агентів](/uk/concepts/multi-agent) і [WhatsApp](/uk/channels/whatsapp).
  </Accordion>

  <Accordion title='Чи можу я запустити агента "швидкого чату" й агента "Opus для кодування"?'>
    Так. Використовуйте маршрутизацію кількох агентів: задайте кожному агенту власну стандартну модель, потім прив’яжіть вхідні маршрути (обліковий запис провайдера або конкретних peers) до кожного агента. Приклад конфігурації наведено в [Маршрутизація кількох агентів](/uk/concepts/multi-agent). Див. також [Моделі](/uk/concepts/models) і [Конфігурація](/uk/gateway/configuration).
  </Accordion>

  <Accordion title="Чи працює Homebrew на Linux?">
    Так. Homebrew підтримує Linux (Linuxbrew). Швидке налаштування:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Якщо ви запускаєте OpenClaw через systemd, переконайтеся, що PATH сервісу містить `/home/linuxbrew/.linuxbrew/bin` (або ваш brew-префікс), щоб інструменти, встановлені через `brew`, знаходилися в non-login shells.
    Останні збірки також додають на початок поширені користувацькі bin-каталоги в сервісах Linux systemd (наприклад `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) і враховують `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` і `FNM_DIR`, коли їх задано.

  </Accordion>

  <Accordion title="Різниця між hackable git install і npm install">
    - **Hackable (git) install:** повний checkout вихідного коду, редагований, найкращий для контриб’юторів.
      Ви запускаєте збірки локально й можете виправляти код/документацію.
    - **npm install:** глобальне встановлення CLI, без репозиторію, найкраще для варіанту "просто запустити".
      Оновлення надходять із npm dist-tags.

    Документація: [Початок роботи](/uk/start/getting-started), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Чи можу я пізніше перемикатися між npm і git installs?">
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
    подальші дії Doctor, оновлює джерела Plugin для цільового каналу та
    перезапускає gateway, якщо ви не передасте `--no-restart`.

    Інсталятор також може примусово вибрати будь-який режим:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Поради щодо резервного копіювання: див. [Стратегія резервного копіювання](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Чи варто запускати Gateway на моєму ноутбуці чи на VPS?">
    Коротка відповідь: **якщо вам потрібна надійність 24/7, використовуйте VPS**. Якщо вам потрібне
    мінімальне тертя й вас влаштовують сон/перезапуски, запускайте локально.

    **Ноутбук (локальний Gateway)**

    - **Переваги:** немає витрат на сервер, прямий доступ до локальних файлів, живе вікно браузера.
    - **Недоліки:** сон/розриви мережі = відключення, оновлення/перезавантаження ОС переривають роботу, має залишатися ввімкненим.

    **VPS / хмара**

    - **Переваги:** завжди ввімкнено, стабільна мережа, немає проблем зі сном ноутбука, легше підтримувати роботу.
    - **Недоліки:** часто працює без графічного інтерфейсу (використовуйте знімки екрана), лише віддалений доступ до файлів, для оновлень потрібно підключатися через SSH.

    **Примітка щодо OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord добре працюють із VPS. Єдиний справжній компроміс — **headless browser** проти видимого вікна. Див. [Браузер](/uk/tools/browser).

    **Рекомендований варіант за замовчуванням:** VPS, якщо раніше у вас були розриви з’єднання Gateway. Локальний запуск чудово підходить, коли ви активно використовуєте Mac і хочете локальний доступ до файлів або автоматизацію UI з видимим браузером.

  </Accordion>

  <Accordion title="Наскільки важливо запускати OpenClaw на виділеній машині?">
    Не обов’язково, але **рекомендовано для надійності та ізоляції**.

    - **Виділений хост (VPS/Mac mini/Pi):** завжди ввімкнений, менше переривань через сон або перезавантаження, чистіші дозволи, легше підтримувати роботу.
    - **Спільний ноутбук/настільний комп’ютер:** цілком підходить для тестування та активного використання, але очікуйте пауз, коли машина переходить у сон або оновлюється.

    Якщо хочете отримати переваги обох підходів, тримайте Gateway на виділеному хості та спаруйте ноутбук як **вузол** для локальних інструментів екрана/камери/exec. Див. [Вузли](/uk/nodes).
    Рекомендації з безпеки див. у [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які мінімальні вимоги до VPS і рекомендована ОС?">
    OpenClaw легковаговий. Для базового Gateway + одного каналу чату:

    - **Абсолютний мінімум:** 1 vCPU, 1GB RAM, ~500MB диска.
    - **Рекомендовано:** 1-2 vCPU, 2GB RAM або більше для запасу (журнали, медіа, кілька каналів). Інструменти Node та автоматизація браузера можуть потребувати багато ресурсів.

    ОС: використовуйте **Ubuntu LTS** (або будь-який сучасний Debian/Ubuntu). Шлях встановлення Linux найкраще протестовано там.

    Документація: [Linux](/uk/platforms/linux), [VPS-хостинг](/uk/vps).

  </Accordion>

  <Accordion title="Чи можна запускати OpenClaw у VM і які вимоги?">
    Так. Ставтеся до VM так само, як до VPS: вона має бути завжди ввімкнена, доступна та мати достатньо
    RAM для Gateway і всіх каналів, які ви вмикаєте.

    Базові рекомендації:

    - **Абсолютний мінімум:** 1 vCPU, 1GB RAM.
    - **Рекомендовано:** 2GB RAM або більше, якщо ви запускаєте кілька каналів, автоматизацію браузера або медіаінструменти.
    - **ОС:** Ubuntu LTS або інший сучасний Debian/Ubuntu.

    Якщо ви на Windows, **WSL2 — найпростіший варіант налаштування в стилі VM** і має найкращу сумісність
    з інструментами. Див. [Windows](/uk/platforms/windows), [VPS-хостинг](/uk/vps).
    Якщо ви запускаєте macOS у VM, див. [macOS VM](/uk/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Пов’язане

- [FAQ](/uk/help/faq) — основний FAQ (моделі, сесії, gateway, безпека тощо)
- [Огляд встановлення](/uk/install)
- [Початок роботи](/uk/start/getting-started)
- [Усунення несправностей](/uk/help/troubleshooting)
